# Setting up Supabase + a vector database + Claude for a law practice

A lawyer uploads the documents for a case. Claude answers questions about that
case in plain English — "what did Smith say about the indemnity clause?" — and
cites the filename, page, and Bates number every time. Nothing from one case
can ever appear in an answer about another case.

Everything below is copy-paste. Budget about an hour end to end.

---

## The one design decision that matters

The instinct is **one bucket per case** (or one database per case). Don't.

|                                    | Bucket/DB per case                    | One database, `case_id` column        |
| ---------------------------------- | ------------------------------------- | ------------------------------------- |
| Isolation                          | Same                                  | Same — enforced by Row Level Security |
| Adding a case                      | New bucket, new policies, new config  | One `INSERT`                          |
| Searching a case                   | Fine                                  | Fine                                  |
| "Which cases mention this expert?" | Impossible without querying N buckets | One query                             |
| At 200 matters                     | 200 buckets of policy sprawl          | Unchanged                             |

So: **one Supabase project, one private storage bucket, one vector table.**
Case separation is a `case_id` column plus a `case_members` table that decides
who can see what. Storage uses folders — `case-files/<case_id>/discovery/depo.pdf`
— which behave exactly like per-case buckets but cost nothing to create.

**The one time you _do_ split projects:** a client contractually requires
physical data separation, a formal ethical wall needs to survive a mistake in
your own code, or a matter has its own data-residency requirement. That's a
per-matter exception, not the default.

---

## What you're building

```
   PDF  ──►  ingest.mjs  ──►  Supabase Storage   (the original file)
                          │
                          └►  chunks table       (text + 1024-number embedding)
                                    ▲
                                    │  match_case_chunks(case_id, query_vector)
                                    │
   Lawyer ──► Claude ──► MCP server ┘
```

- **Supabase Storage** holds the original PDFs. Private bucket, links expire.
- **The vector table** holds each document sliced into ~1000-token passages,
  each stored alongside a list of 1024 numbers (an _embedding_) that captures
  what the passage means. Similar meanings produce similar numbers, which is
  how "indemnity obligations" finds a paragraph that says "hold harmless."
- **The MCP server** is a ~150-line script that lets Claude search that table.

---

## Part 1 — Supabase

### Step 1. Create the project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name it something like `firm-cases`.
3. Pick the region closest to the office.
4. Save the database password somewhere safe — you can't see it again.
5. Wait ~2 minutes for provisioning.

Then go to **Project Settings → API Keys** and copy two things:

| Key                     | Where it may live                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `service_role` (secret) | Your laptop or your server. **Never** a browser, never a repo, never pasted into a chat. It ignores all access rules by design. |
| `publishable` / `anon`  | Safe in a browser. Only ever sees what Row Level Security allows.                                                               |

### Step 2. Create the schema

Open **SQL Editor → New query**, paste the entire contents of
[`scripts/legal-rag/schema.sql`](../scripts/legal-rag/schema.sql), and hit **Run**.

That one script:

- turns on `pgvector` (the extension that makes Postgres a vector database),
- creates `cases`, `case_members`, `documents`, and `chunks`,
- builds an **HNSW** index so searching a million passages takes milliseconds,
- builds a **full-text** index so exact strings like a Bates number still hit,
- turns on Row Level Security with a default of _deny_,
- creates the private `case-files` storage bucket and its folder policies,
- creates `match_case_chunks()`, the search function Claude will call.

You should see `Success. No rows returned`.

### Step 3. Add your first case

In the SQL Editor:

```sql
insert into cases (matter_number, client_name, caption, jurisdiction)
values ('2026-0142', 'Jane Doe', 'Doe v. Acme Corp.', 'N.D. Cal.');
```

### Step 4. Get an embeddings key

Supabase stores the vectors; it doesn't create them. Something has to turn text
into 1024 numbers. Two good options:

|                 | Model                             | Dimensions | Cost                         | Why                                                                                                                                                  |
| --------------- | --------------------------------- | ---------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended** | `voyage-law-2`                    | 1024       | $0.12 / 1M tokens (50M free) | Trained on ~1T tokens of contracts, statutes, and case law. Beats general-purpose models by ~6% on legal retrieval and ~23% on long legal documents. |
| Fallback        | `text-embedding-3-small` (OpenAI) | 1536       | $0.02 / 1M tokens            | Cheaper, and you may already have the key.                                                                                                           |

Get a Voyage key at [dashboard.voyageai.com](https://dashboard.voyageai.com).

> If you use the OpenAI model instead, change **every** `1024` in `schema.sql`
> to `1536` before running it, and point the `embed()` function in `ingest.mjs`
> at OpenAI's endpoint. The number of dimensions in the column must match the
> model exactly, forever — switching models later means re-embedding everything.

---

## Part 2 — Load a case

### Step 5. Install and configure

```bash
npm install @supabase/supabase-js unpdf @modelcontextprotocol/server zod

cp scripts/legal-rag/.env.example scripts/legal-rag/.env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY
set -a && source scripts/legal-rag/.env && set +a
```

### Step 6. Ingest documents

```bash
node scripts/legal-rag/ingest.mjs \
  --matter 2026-0142 \
  --file ~/cases/doe/depo-smith.pdf \
  --type discovery \
  --bates 004512
```

For a folder of files:

```bash
for f in ~/cases/doe/discovery/*.pdf; do
  node scripts/legal-rag/ingest.mjs --matter 2026-0142 --file "$f" --type discovery
done
```

What it does: reads the PDF page by page → splits it into ~1000-token
overlapping passages that remember their page number → sends them to Voyage in
batches of 64 → uploads the original to `case-files/<case_id>/discovery/` →
writes one `chunks` row per passage. Re-running it on the same file replaces
that file's passages instead of duplicating them.

**Scanned PDFs have no text layer.** If ingest reports "No extractable text,"
OCR the file first (`ocrmypdf in.pdf out.pdf`) and re-run.

### Step 7. Confirm it worked

SQL Editor:

```sql
select c.matter_number, d.filename, count(ch.id) as passages
from chunks ch
join documents d on d.id = ch.document_id
join cases c on c.id = ch.case_id
group by 1, 2 order by 1, 2;
```

---

## Part 3 — Connect Claude

There are two ways, and you probably want both.

### Option A — the case-search server (this is the one that matters)

[`scripts/legal-rag/mcp-server.mjs`](../scripts/legal-rag/mcp-server.mjs) gives
Claude exactly three tools and nothing else:

- `list_cases` — the matters on file
- `search_case` — semantic + keyword search **inside one matter**
- `get_document_link` — a download link for a source file, expiring in an hour

Claude cannot query the database freely, cannot join across matters, and cannot
see a case it wasn't pointed at. The `search_case` tool takes a matter number
and filters on it in three separate places.

**Claude Code:**

```bash
claude mcp add \
  --env SUPABASE_URL="$SUPABASE_URL" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --env VOYAGE_API_KEY="$VOYAGE_API_KEY" \
  case-files -- node "$PWD/scripts/legal-rag/mcp-server.mjs"
```

**Claude Desktop** — Settings → Developer → Edit Config, then add:

```json
{
  "mcpServers": {
    "case-files": {
      "command": "node",
      "args": ["/absolute/path/to/scripts/legal-rag/mcp-server.mjs"],
      "env": {
        "SUPABASE_URL": "https://YOUR-REF.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "...",
        "VOYAGE_API_KEY": "..."
      }
    }
  }
}
```

Restart Claude Desktop. You should see the three tools in the tools menu.

### Option B — Supabase's own MCP server (read-only, for the structured stuff)

This one answers "how many discovery documents are in the Doe matter?" and
"which matters opened this quarter?" — questions about the _database_, not the
_documents_.

```bash
claude mcp add supabase -- npx -y @supabase/mcp-server-supabase@latest \
  --read-only --project-ref=YOUR-PROJECT-REF
```

Keep `--read-only` and `--project-ref` on. Read-only stops it writing anything;
`--project-ref` locks it to this one project.

### Option C — building this into an app

If the lawyer should use a web app rather than Claude Desktop, call the Claude
API with `search_case` defined as a tool. Use `claude-opus-5`, and pass
`thinking: { type: "adaptive" }`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  system:
    "You are a legal research assistant. Answer only from passages returned " +
    "by search_case. Cite filename, page, and Bates number for every " +
    "assertion. If the documents do not answer the question, say so.",
  tools: [
    {
      name: "search_case",
      description: "Search the documents in one matter and return passages.",
      input_schema: {
        type: "object",
        properties: {
          matter_number: { type: "string" },
          question: { type: "string" },
        },
        required: ["matter_number", "question"],
      },
    },
  ],
  messages: [{ role: "user", content: "In 2026-0142, who signed the MSA?" }],
});
```

Run the tool loop yourself, or let the SDK do it with
`client.beta.messages.toolRunner(...)`.

---

## Part 4 — Using it

Ask Claude things like:

- "List the cases."
- "In matter 2026-0142, what does the MSA say about indemnification?"
- "Find every passage in 2026-0142 where Smith discusses the March meeting."
- "Pull up the source document for that second passage."

**Add this to your Claude project instructions** — it's the difference between
a useful tool and a liability:

> When answering questions about a case, use only passages returned by
> `search_case`. Cite the filename, page, and Bates number for every assertion.
> If the returned passages don't answer the question, say so — do not reason
> from general legal knowledge and present it as a finding from the record.
> Never search one matter to answer a question about another.

---

## Confidentiality checklist

This is a database of privileged material. Before it holds anything real:

- [ ] **The `service_role` key lives in exactly two places** — the ingest
      machine and the MCP server's config. Not in git, not in a browser, not in
      a Slack message. `.env` is already gitignored; verify it.
- [ ] **RLS is on and denies by default.** Run Supabase's **Advisors →
      Security** check and clear every finding.
- [ ] **The bucket is private.** `case-files` has `public = false`; downloads
      go through one-hour signed URLs only.
- [ ] **Every case has a `case_members` row per person who should see it.** An
      empty membership list means nobody sees the case — that's the correct
      default, and it's what makes an ethical wall real rather than a habit.
- [ ] **Supabase plan and region** match the firm's obligations. If any matter
      touches PHI, you need a signed BAA and a HIPAA-eligible configuration —
      confirm the current plan requirement with Supabase directly, since it is
      not stated in their public compliance docs.
- [ ] **Check the retention and training terms of every vendor in the chain** —
      Anthropic for the model, Voyage/OpenAI for embeddings, Supabase for
      storage. On the Anthropic API, inputs and outputs are not used to train
      models by default; confirm the equivalent in writing for the others, and
      ask about zero-retention if a matter needs it.
- [ ] **Turn on database backups and point-in-time recovery** before the first
      real matter.
- [ ] **Confidentiality and competence duties still apply to the tool.** ABA
      Formal Opinion 512 (July 2024) addresses generative AI specifically —
      informed client consent, verification of output, and reasonable fee
      practices. Read it before this touches a live matter. _(Not legal advice
      — it's your call and your bar's rules.)_
- [ ] **Verify before filing.** Retrieval reduces fabrication; it does not
      eliminate it. Every citation gets checked against the source document,
      which is exactly what `get_document_link` is for.

---

## What it costs

Assume 50 matters, 500 pages each — roughly 25,000 pages, about 12M tokens.

|                                 |                                                                 |
| ------------------------------- | --------------------------------------------------------------- |
| Supabase Pro                    | $25/month (8 GB database, 100 GB storage)                       |
| Embedding the corpus, once      | ~$1.50 at Voyage's $0.12/1M — and the first 50M tokens are free |
| Embedding search queries        | Negligible (~500 tokens each)                                   |
| Claude API, if you build an app | $5/1M input, $25/1M output on `claude-opus-5`                   |
| Claude Desktop / Claude Code    | Covered by the existing subscription                            |

The realistic first-year number is the Supabase subscription plus pocket change.

---

## Troubleshooting

| Symptom                                 | Cause                                      | Fix                                                                                                                |
| --------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `No extractable text`                   | Scanned PDF with no text layer             | `ocrmypdf in.pdf out.pdf`, re-ingest                                                                               |
| `expected 1024 dimensions, not 1536`    | Column and model disagree                  | Pick one; if you switch models, re-embed everything                                                                |
| Search returns nothing                  | Passages ingested under a different matter | `select matter_number, count(*) from chunks join cases on cases.id = chunks.case_id group by 1;`                   |
| Search returns everything, badly ranked | Embeddings are `null`                      | The ingest run failed partway — re-run it                                                                          |
| Claude can't see the tools              | Bad path or missing env in the MCP config  | Use an absolute path; test with `node scripts/legal-rag/mcp-server.mjs` (it should hang silently — that's correct) |
| Lawyer sees no cases in the app         | No `case_members` row                      | `insert into case_members (case_id, user_id) values (...);`                                                        |
| Search slows down past ~500k passages   | HNSW index needs more memory               | Raise `hnsw.ef_search`, or move to a larger Supabase compute add-on                                                |

---

## Verified

The schema, RLS policies, and `match_case_chunks()` were run against Postgres 16
with fixtures before this was written:

- a member of the Doe matter sees 1 case and 3 passages; a non-member sees 0 and 0
- calling `match_case_chunks()` directly as a non-member returns 0 rows
- searching matter 2026-0999 returns no rows belonging to matter 2026-0142
- the keyword arm promotes an exact-phrase passage to the top even when the
  query vector points elsewhere — which is what keeps Bates numbers findable

The MCP server was exercised over stdio: it completes the handshake and lists
all three tools with correct schemas.
