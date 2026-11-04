/**
 * Creates the private media bucket.
 *
 *   node scripts/setup-storage.mjs
 *
 * schema.sql tries to insert into storage.buckets, but the SQL editor often
 * cannot write to the storage schema, which Supabase owns. The storage API
 * can, so this does the same job with the service-role key. Safe to re-run:
 * if the bucket exists it only corrects its settings.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "letter-media";

const OPTIONS = {
  public: false,
  fileSizeLimit: 8 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/mp4",
  ],
};

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

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existing } = await db.storage.listBuckets();
const already = (existing ?? []).some((b) => b.name === BUCKET);

if (already) {
  const { error } = await db.storage.updateBucket(BUCKET, OPTIONS);
  console.log(error ? `Could not update ${BUCKET}: ${error.message}` : `${BUCKET} already existed; settings corrected.`);
} else {
  const { error } = await db.storage.createBucket(BUCKET, OPTIONS);
  if (error) {
    console.log(`Could not create ${BUCKET}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Created ${BUCKET} (private, 8 MB limit).`);
}

const { data: after } = await db.storage.listBuckets();
for (const b of after ?? []) {
  console.log(`  ${b.name} — ${b.public ? "PUBLIC (wrong!)" : "private"}`);
}
