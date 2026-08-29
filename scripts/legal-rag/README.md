# Legal case RAG — Supabase + Claude

A per-case document database a lawyer can ask questions of in plain English,
with citations back to the filename, page, and Bates number.

Full walkthrough: [`docs/supabase-legal-rag-setup.md`](../../docs/supabase-legal-rag-setup.md)

| File             | What it is                                                                         |
| ---------------- | ---------------------------------------------------------------------------------- |
| `schema.sql`     | Run once in the Supabase SQL Editor. Tables, RLS, storage bucket, search function. |
| `ingest.mjs`     | Add a document to a case: upload → extract text → chunk → embed → store.           |
| `mcp-server.mjs` | Gives Claude three tools: `list_cases`, `search_case`, `get_document_link`.        |
| `.env.example`   | The three secrets both scripts need.                                               |

## Quick start

```bash
npm install @supabase/supabase-js unpdf @modelcontextprotocol/server zod

# 1. Paste schema.sql into Supabase -> SQL Editor -> Run
# 2. Add a case (SQL Editor):
#    insert into cases (matter_number, client_name, caption)
#    values ('2026-0142', 'Jane Doe', 'Doe v. Acme Corp.');

cp scripts/legal-rag/.env.example scripts/legal-rag/.env   # then fill it in
set -a && source scripts/legal-rag/.env && set +a

# 3. Load documents
node scripts/legal-rag/ingest.mjs --matter 2026-0142 --file ./depo-smith.pdf --type discovery

# 4. Point Claude at it
claude mcp add case-files -- node "$PWD/scripts/legal-rag/mcp-server.mjs"
```

These scripts are standalone — they are not part of the portfolio app's build.
