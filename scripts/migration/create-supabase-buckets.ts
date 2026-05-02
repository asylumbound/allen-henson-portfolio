/**
 * scripts/migration/create-supabase-buckets.ts
 *
 * Creates or verifies required Supabase Storage buckets.
 *
 * Usage:
 *   npx tsx scripts/migration/create-supabase-buckets.ts            # dry-run (default)
 *   npx tsx scripts/migration/create-supabase-buckets.ts --apply    # actually create/update buckets
 *
 * Required env vars (in .env or environment):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const DRY_RUN = !process.argv.includes("--apply");

interface BucketSpec {
  name: string;
  public: boolean;
}

const DESIRED_BUCKETS: BucketSpec[] = [
  { name: "gallery", public: true },
  { name: "app-assets", public: true },
  { name: "video", public: true },
  { name: "duke-edits", public: true },
  { name: "duke-backups", public: false },
  { name: "agency-private", public: false },
];

type RowStatus = "ok" | "will-create" | "warning" | "error" | "dry-run-create";

interface ResultRow {
  bucket: string;
  desired: string;
  exists: string;
  action: string;
  status: RowStatus;
  note?: string;
}

function pad(str: string, len: number): string {
  return str.padEnd(len).slice(0, len);
}

function printTable(rows: ResultRow[]): void {
  const headers = ["Bucket", "Desired Visibility", "Exists", "Action", "Status"];
  const widths = [
    Math.max(6, ...rows.map((r) => r.bucket.length)),
    18,
    6,
    Math.max(6, ...rows.map((r) => r.action.length)),
    Math.max(6, ...rows.map((r) => r.status.length)),
  ];

  const line = widths.map((w) => "-".repeat(w)).join("-+-");
  const header = headers.map((h, i) => pad(h, widths[i])).join(" | ");

  console.log("\n" + header);
  console.log(line);
  for (const row of rows) {
    const noteStr = row.note ? ` (${row.note})` : "";
    console.log(
      [
        pad(row.bucket, widths[0]),
        pad(row.desired, widths[1]),
        pad(row.exists, widths[2]),
        pad(row.action, widths[3]),
        pad(row.status + noteStr, widths[4]),
      ].join(" | ")
    );
  }
  console.log(line + "\n");
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!DRY_RUN && (!supabaseUrl || !serviceRoleKey)) {
    console.error(
      "\n❌ --apply mode requires both VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.\n"
    );
    process.exit(1);
  }

  if (DRY_RUN && !supabaseUrl) {
    // Offline dry-run: show planned state without connecting to Supabase
    console.log(
      "  ⚠️  VITE_SUPABASE_URL not set — showing planned bucket topology only (cannot verify existing buckets).\n"
    );
    const rows: ResultRow[] = DESIRED_BUCKETS.map((spec) => ({
      bucket: spec.name,
      desired: spec.public ? "public" : "private",
      exists: "unknown",
      action: "CREATE",
      status: "dry-run-create",
    }));
    printTable(rows);
    console.log(
      "✅ Offline dry-run complete. Set VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and run with --apply to create buckets.\n"
    );
    return;
  }

  if (DRY_RUN) {
    console.log(
      "\n🔍 DRY-RUN MODE — no buckets will be created or modified. Pass --apply to execute.\n"
    );
  } else {
    console.log("\n🚀 APPLY MODE — buckets will be created/updated.\n");
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false },
  });

  // Fetch existing buckets
  const { data: existingBuckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const existingMap = new Map(
    (existingBuckets ?? []).map((b) => [b.name, b])
  );

  const rows: ResultRow[] = [];

  for (const spec of DESIRED_BUCKETS) {
    const existing = existingMap.get(spec.name);
    const desiredLabel = spec.public ? "public" : "private";

    if (!existing) {
      // Bucket does not exist
      const row: ResultRow = {
        bucket: spec.name,
        desired: desiredLabel,
        exists: "no",
        action: "CREATE",
        status: DRY_RUN ? "dry-run-create" : "ok",
      };

      if (!DRY_RUN) {
        const { error: createError } = await supabase.storage.createBucket(
          spec.name,
          { public: spec.public }
        );
        if (createError) {
          row.status = "error";
          row.note = createError.message;
        } else {
          row.status = "ok";
          row.note = "created";
        }
      }

      rows.push(row);
    } else {
      // Bucket exists — check visibility
      const actualPublic = existing.public ?? false;
      if (actualPublic === spec.public) {
        rows.push({
          bucket: spec.name,
          desired: desiredLabel,
          exists: "yes",
          action: "none",
          status: "ok",
          note: "matches",
        });
      } else {
        const actualLabel = actualPublic ? "public" : "private";
        const row: ResultRow = {
          bucket: spec.name,
          desired: desiredLabel,
          exists: "yes",
          action: DRY_RUN ? "WOULD-UPDATE" : "UPDATE",
          status: "warning",
          note: `currently ${actualLabel}`,
        };

        if (!DRY_RUN) {
          const { error: updateError } = await supabase.storage.updateBucket(
            spec.name,
            { public: spec.public }
          );
          if (updateError) {
            row.status = "error";
            row.note = `update failed: ${updateError.message}`;
          } else {
            row.status = "ok";
            row.note = `updated from ${actualLabel} to ${desiredLabel}`;
          }
        }

        rows.push(row);
      }
    }
  }

  printTable(rows);

  const errors = rows.filter((r) => r.status === "error");
  const warnings = rows.filter((r) => r.status === "warning");
  const created = rows.filter((r) => r.note?.includes("created"));

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s) encountered.`);
    process.exit(1);
  }

  if (DRY_RUN) {
    const toCreate = rows.filter((r) => r.status === "dry-run-create");
    console.log(
      `✅ Dry-run complete. ${toCreate.length} bucket(s) would be created, ${warnings.length} warning(s).`
    );
    console.log(
      "   Run with --apply to create/update buckets.\n"
    );
  } else {
    console.log(
      `✅ Done. ${created.length} bucket(s) created, ${warnings.length} warning(s).\n`
    );
  }
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
