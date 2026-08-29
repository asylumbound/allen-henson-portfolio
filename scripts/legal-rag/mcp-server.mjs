#!/usr/bin/env node
/**
 * MCP server that gives Claude three tools over the case database:
 *
 *   list_cases         — what matters exist
 *   search_case        — semantic + keyword search inside ONE case
 *   get_document_link  — a time-limited download link for a source file
 *
 * Claude never gets the whole database. Every search is scoped to a single
 * matter number, so one case's documents can't leak into another case's answer.
 *
 * Register it with Claude Code:
 *   claude mcp add case-files -- node /absolute/path/to/mcp-server.mjs
 *
 * Or in Claude Desktop's claude_desktop_config.json:
 *   { "mcpServers": { "case-files": {
 *       "command": "node",
 *       "args": ["/absolute/path/to/mcp-server.mjs"],
 *       "env": { "SUPABASE_URL": "...", "SUPABASE_SERVICE_ROLE_KEY": "...",
 *                "VOYAGE_API_KEY": "..." } } } }
 */
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createClient } from "@supabase/supabase-js";
import * as z from "zod/v4";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY } = process.env;
const EMBED_MODEL = process.env.EMBED_MODEL ?? "voyage-law-2";

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VOYAGE_API_KEY,
})) {
  if (!value) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Embed a search query. input_type "query" is what makes retrieval accurate. */
async function embedQuery(text) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: [text],
      input_type: "query",
    }),
  });
  if (!res.ok) throw new Error(`Voyage ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding;
}

const text = value => ({ content: [{ type: "text", text: value }] });

const server = new McpServer({ name: "case-files", version: "1.0.0" });

server.registerTool(
  "list_cases",
  {
    title: "List cases",
    description:
      "List every matter in the case database with its matter number, client, and caption. " +
      "Call this first to find the matter number for a case the user names in plain English.",
    inputSchema: z.object({}),
  },
  async () => {
    const { data, error } = await db
      .from("cases")
      .select("matter_number, client_name, caption, jurisdiction, status, opened_at")
      .order("opened_at", { ascending: false });
    if (error) return text(`Error: ${error.message}`);
    if (!data.length) return text("No cases yet.");
    return text(
      data
        .map(
          c =>
            `${c.matter_number} — ${c.caption ?? c.client_name} ` +
            `(client: ${c.client_name}; ${c.jurisdiction ?? "n/a"}; ${c.status}; opened ${c.opened_at})`
        )
        .join("\n")
    );
  }
);

server.registerTool(
  "search_case",
  {
    title: "Search one case's documents",
    description:
      "Search the documents filed under ONE matter and return the most relevant passages, " +
      "each with its filename, page number, and Bates number. Ask a full question rather " +
      "than keywords — retrieval is semantic. Results never cross matters.",
    inputSchema: z.object({
      matter_number: z
        .string()
        .describe("The matter number, e.g. '2026-0142'. Get it from list_cases."),
      question: z
        .string()
        .describe("What you want to find, phrased as a question or a description."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(12)
        .describe("How many passages to return."),
    }),
  },
  async ({ matter_number, question, limit }) => {
    const { data: kase, error: caseErr } = await db
      .from("cases")
      .select("id, caption")
      .eq("matter_number", matter_number)
      .single();
    if (caseErr) return text(`No case with matter number ${matter_number}.`);

    const embedding = await embedQuery(question);
    const { data: hits, error } = await db.rpc("match_case_chunks", {
      p_case_id: kase.id,
      p_query_embedding: embedding,
      p_query_text: question,
      p_match_count: limit,
    });
    if (error) return text(`Search failed: ${error.message}`);
    if (!hits.length) return text(`No passages in ${matter_number} matched that question.`);

    return text(
      hits
        .map(
          (h, i) =>
            `[${i + 1}] ${h.filename}` +
            (h.page_number ? `, p.${h.page_number}` : "") +
            (h.bates_start ? ` (Bates ${h.bates_start})` : "") +
            ` — similarity ${h.similarity.toFixed(3)}\n` +
            `document_id: ${h.document_id}\n\n${h.content}`
        )
        .join("\n\n---\n\n")
    );
  }
);

server.registerTool(
  "get_document_link",
  {
    title: "Get a document download link",
    description:
      "Return a link to the original file for a document_id returned by search_case. " +
      "The link expires in one hour.",
    inputSchema: z.object({
      document_id: z.string().describe("The document_id shown in a search_case result."),
    }),
  },
  async ({ document_id }) => {
    const { data: doc, error: docErr } = await db
      .from("documents")
      .select("storage_path, filename")
      .eq("id", document_id)
      .single();
    if (docErr) return text(`No document with id ${document_id}.`);

    const { data, error } = await db.storage
      .from("case-files")
      .createSignedUrl(doc.storage_path, 3600);
    if (error) return text(`Could not create link: ${error.message}`);
    return text(`${doc.filename}: ${data.signedUrl}\n(expires in 1 hour)`);
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
