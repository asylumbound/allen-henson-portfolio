#!/usr/bin/env node
/**
 * Ingest one document into a case: upload -> extract text -> chunk -> embed -> store.
 *
 *   node scripts/legal-rag/ingest.mjs \
 *     --matter 2026-0142 \
 *     --file ./depo-smith.pdf \
 *     --type discovery \
 *     --bates 004512
 *
 * Requires (see .env.example in this folder):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY
 *
 * This script uses the service_role key, so it bypasses RLS by design.
 * Run it on a trusted machine or server. Never ship this key to a browser.
 */
import { createHash } from "node:crypto";
import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY } = process.env;

const EMBED_MODEL = process.env.EMBED_MODEL ?? "voyage-law-2";
const CHUNK_CHARS = 4000; // ~1000 tokens
const CHUNK_OVERLAP = 600;
const EMBED_BATCH = 64;

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--")) continue;
    args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

/** Split page text into overlapping chunks, keeping the page number on each. */
function chunkPages(pages) {
  const chunks = [];
  pages.forEach((pageText, pageIdx) => {
    const text = pageText.replace(/\s+/g, " ").trim();
    if (!text) return;
    for (let start = 0; start < text.length; start += CHUNK_CHARS - CHUNK_OVERLAP) {
      const slice = text.slice(start, start + CHUNK_CHARS).trim();
      if (slice.length < 50) break;
      chunks.push({ page_number: pageIdx + 1, content: slice });
      if (start + CHUNK_CHARS >= text.length) break;
    }
  });
  return chunks;
}

/** Voyage returns one 1024-dim vector per input string, in order. */
async function embed(texts, inputType) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      input_type: inputType, // "document" when storing, "query" when searching
    }),
  });
  if (!res.ok) {
    throw new Error(`Voyage ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}

// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.matter || !args.file) {
    console.error("Usage: ingest.mjs --matter <number> --file <path> [--type <t>] [--bates <n>]");
    process.exit(1);
  }
  for (const [name, value] of Object.entries({
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    VOYAGE_API_KEY,
  })) {
    if (!value) throw new Error(`Missing env var ${name}`);
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Resolve the matter number to a case id.
  const { data: kase, error: caseErr } = await db
    .from("cases")
    .select("id, caption")
    .eq("matter_number", args.matter)
    .single();
  if (caseErr) throw new Error(`No case with matter_number ${args.matter}: ${caseErr.message}`);
  console.log(`Case ${args.matter} — ${kase.caption ?? "(no caption)"}`);

  // 2. Read the file and extract text page by page.
  const bytes = await readFile(args.file);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { totalPages, text: pages } = await extractText(pdf, { mergePages: false });
  console.log(`Read ${totalPages} pages from ${basename(args.file)}`);

  const chunks = chunkPages(pages);
  if (chunks.length === 0) {
    throw new Error("No extractable text. Scanned PDF? Run it through OCR first.");
  }
  console.log(`Split into ${chunks.length} chunks`);

  // 3. Upload the original to Storage under the case folder.
  const docType = args.type ?? "general";
  const storagePath = `${kase.id}/${docType}/${basename(args.file)}`;
  const { error: uploadErr } = await db.storage
    .from("case-files")
    .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
  console.log(`Uploaded to case-files/${storagePath}`);

  // 4. Record the document.
  const { data: doc, error: docErr } = await db
    .from("documents")
    .upsert(
      {
        case_id: kase.id,
        storage_path: storagePath,
        filename: basename(args.file),
        doc_type: docType,
        bates_start: args.bates ?? null,
        page_count: totalPages,
        sha256,
      },
      { onConflict: "storage_path" }
    )
    .select("id")
    .single();
  if (docErr) throw new Error(`Document insert failed: ${docErr.message}`);

  // Re-ingesting the same path replaces its chunks rather than duplicating them.
  await db.from("chunks").delete().eq("document_id", doc.id);

  // 5. Embed in batches and insert.
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const vectors = await embed(batch.map(c => c.content), "document");
    const rows = batch.map((chunk, j) => ({
      case_id: kase.id,
      document_id: doc.id,
      chunk_index: i + j,
      page_number: chunk.page_number,
      content: chunk.content,
      embedding: vectors[j],
    }));
    const { error: chunkErr } = await db.from("chunks").insert(rows);
    if (chunkErr) throw new Error(`Chunk insert failed: ${chunkErr.message}`);
    console.log(`  embedded ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length}`);
  }

  console.log(`Done. ${chunks.length} chunks are now searchable for matter ${args.matter}.`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
