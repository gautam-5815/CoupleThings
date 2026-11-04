/**
 * Applies supabase/schema.sql over a direct Postgres connection.
 *
 *   node scripts/migrate.mjs "postgresql://postgres:PASSWORD@host:5432/postgres"
 *   node scripts/migrate.mjs            (reuses DATABASE_URL from .env.local)
 *
 * Given a connection string it saves it to .env.local first, so one command
 * does the whole job.
 *
 * This exists because the Supabase SQL editor runs a script as one
 * transaction and silently rolls the whole thing back when any statement is
 * refused, which is easy to miss. Here every error is reported as Postgres
 * sends it, and the connection string names the database explicitly, so
 * there is no doubt about which project is being changed.
 *
 * The connection string is a password. Passing it as an argument puts it in
 * your shell history: clear that afterwards (PowerShell keeps it in
 * (Get-PSReadlineOption).HistorySavePath) if that matters to you.
 */
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const ENV_PATH = new URL("../.env.local", import.meta.url);

function env() {
  const out = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function saveUrl(url) {
  let text = readFileSync(ENV_PATH, "utf8");
  if (/^DATABASE_URL=.*$/m.test(text)) {
    text = text.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${url}`);
  } else {
    text = `${text.trimEnd()}\n\n# Direct Postgres connection, used only by scripts/migrate.mjs.\nDATABASE_URL=${url}\n`;
  }
  writeFileSync(ENV_PATH, text, "utf8");
  console.log("Saved DATABASE_URL to .env.local\n");
}

const given = process.argv[2]?.trim();

if (given) {
  if (!given.startsWith("postgres")) {
    console.log("That does not look like a postgres:// connection string.");
    process.exit(1);
  }
  if (given.includes("[YOUR-PASSWORD]")) {
    console.log("The string still has the [YOUR-PASSWORD] placeholder in it.");
    console.log("Replace it with your database password and run this again.");
    process.exit(1);
  }
  saveUrl(given);
}

const connectionString = given || env().DATABASE_URL;

if (!connectionString) {
  console.log("No connection string given and none in .env.local.");
  console.log("Supabase: Settings -> Database -> Connection string -> URI, then:");
  console.log('  node scripts/migrate.mjs "postgresql://postgres:PASSWORD@host:5432/postgres"');
  process.exit(1);
}

// Supabase requires TLS. Its certificate chain is not in Node's trust store,
// so verification is relaxed for this one administrative connection.
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

try {
  await client.connect();

  const { rows: who } = await client.query(
    "select current_database() as db, current_user as role, inet_server_addr()::text as host",
  );
  console.log(`Connected to ${who[0].db} as ${who[0].role}\n`);

  await client.query(sql);
  console.log("schema.sql applied with no errors.\n");

  const { rows: tables } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log(`Tables in public (${tables.length}):`);
  for (const t of tables) console.log(`  ${t.table_name}`);

  const { rows: rls } = await client.query(
    "select relrowsecurity as on from pg_class where oid = 'public.letters'::regclass",
  );
  console.log(`\nRow Level Security on letters: ${rls[0]?.on ? "enabled" : "NOT ENABLED"}`);

  const { rows: policies } = await client.query(
    "select count(*)::int as n from pg_policies where schemaname = 'public' and tablename = 'letters'",
  );
  console.log(`Policies on letters: ${policies[0].n} (0 is correct: server routes only)`);

  // Make PostgREST pick the table up at once rather than on its own schedule.
  await client.query("notify pgrst, 'reload schema'");
  console.log("\nAsked PostgREST to reload its schema cache.");

  // Prove writing works here, where a plain error comes back, rather than
  // leaving it to fail later as an opaque 500 in the app.
  const probe = "migrationprobe00000001";
  await client.query(
    "insert into public.letters (id, owner_token_hash, payload) values ($1, $2, $3)",
    [probe, "0".repeat(64), JSON.stringify({ probe: true })],
  );
  await client.query("delete from public.letters where id = $1", [probe]);
  console.log("Write test: OK (a row was inserted and removed).");
} catch (error) {
  console.log(`FAILED: ${error.message}`);
  if (error.detail) console.log(`detail: ${error.detail}`);
  if (error.hint) console.log(`hint: ${error.hint}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
