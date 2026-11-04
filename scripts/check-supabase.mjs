/**
 * Checks what actually exists in the Supabase project.
 *
 *   node scripts/check-supabase.mjs
 *
 * Reads .env.local directly, so it works without the dev server. It prints
 * only whether things exist, never any key.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function env() {
  const out = {};
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env();

if (!url || !key) {
  console.log("Missing URL or service_role key in .env.local.");
  process.exit(1);
}

console.log(`Project: ${url}\n`);
const db = createClient(url, key, { auth: { persistSession: false } });

// 1. The table, through PostgREST (this is what the app uses).
//    A real GET, not a HEAD: a HEAD response carries no body, so PostgREST
//    cannot report "no such table" in one and the check passes falsely.
const { data: rows, error: tableError } = await db.from("letters").select("id").limit(1);

if (tableError) {
  console.log(`letters table : NOT REACHABLE — ${tableError.message}`);
} else {
  console.log(`letters table : OK (${rows?.length ?? 0} row(s) sampled)`);
}

// 1b. Writing is a separate question. PostgREST keeps column metadata in a
//     cache that writes need and reads do not, so a freshly created table can
//     answer SELECT and still refuse INSERT until that cache reloads.
let writeOk = false;
if (!tableError) {
  const probe = "healthcheckprobe000001";
  const { error: insertError } = await db
    .from("letters")
    .insert({ id: probe, owner_token_hash: "0".repeat(64), payload: {}, published: false });

  if (insertError) {
    console.log(`writing       : REFUSED — ${insertError.message}`);
  } else {
    writeOk = true;
    console.log("writing       : OK");
    await db.from("letters").delete().eq("id", probe);
  }
}

// 2. The bucket, through the storage API, which has its own path and does
//    NOT go through PostgREST's schema cache. If this exists but the table
//    does not, the SQL ran and the cache is merely stale.
const { data: buckets, error: bucketError } = await db.storage.listBuckets();

if (bucketError) {
  console.log(`storage       : NOT REACHABLE — ${bucketError.message}`);
} else {
  const names = buckets.map((b) => `${b.name}${b.public ? " (PUBLIC!)" : " (private)"}`);
  const found = buckets.some((b) => b.name === "letter-media");
  console.log(`letter-media  : ${found ? "OK" : "MISSING"}`);
  console.log(`all buckets   : ${names.length ? names.join(", ") : "none"}`);
}

console.log("");
if (!tableError && !writeOk) {
  console.log(
    "The table exists but PostgREST will not write to it: its schema cache is\n" +
      "stale. Run this one line in the Supabase SQL editor:\n\n" +
      "    NOTIFY pgrst, 'reload schema';\n\n" +
      "then run this script again.",
  );
}
if (tableError && !bucketError) {
  const bucketExists = (buckets ?? []).some((b) => b.name === "letter-media");
  console.log(
    bucketExists
      ? "The bucket exists but the table does not: the SQL ran only in part, or\n" +
          "PostgREST's schema cache is stale. Re-run schema.sql, then reload the\n" +
          "schema cache from the dashboard (Settings -> API -> Reload schema cache)."
      : "Neither the table nor the bucket exists, so supabase/schema.sql has not\n" +
          "been run successfully in this project. Paste the whole file into the\n" +
          "SQL editor and check it reports success.",
  );
}
