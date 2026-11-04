/**
 * Copies the secrets from .env.local into the linked Vercel project.
 *
 *   npx vercel login      (once)
 *   npx vercel link       (once, pick the project)
 *   node scripts/push-env-to-vercel.mjs
 *
 * Values are piped straight from your file to the Vercel CLI. They are never
 * printed, never passed as command-line arguments (which would put them in
 * your shell history), and never leave your machine except to Vercel.
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const WANTED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "NEXT_PUBLIC_SITE_URL",
];

const TARGETS = ["production", "preview", "development"];

function env() {
  const out = {};
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const values = env();

function add(name, value, target) {
  return new Promise((resolve) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["--yes", "vercel", "env", "add", name, target],
      { stdio: ["pipe", "pipe", "pipe"] },
    );

    let err = "";
    child.stdout.on("data", () => {});
    child.stderr.on("data", (d) => (err += d.toString()));

    child.stdin.write(value + "\n");
    child.stdin.end();

    child.on("close", (code) => {
      if (code === 0) console.log(`  ${name} -> ${target}: added`);
      else if (/already exists/i.test(err)) console.log(`  ${name} -> ${target}: already set, left alone`);
      else console.log(`  ${name} -> ${target}: FAILED${err.trim() ? ` (${err.trim().split("\n").pop()})` : ""}`);
      resolve();
    });
  });
}

console.log("Copying secrets from .env.local into Vercel.\n");

for (const name of WANTED) {
  const value = values[name];
  if (!value) {
    console.log(`  ${name}: not in .env.local, skipped`);
    continue;
  }
  for (const target of TARGETS) {
    await add(name, value, target);
  }
}

console.log("\nDone. Remember to set NEXT_PUBLIC_SITE_URL to the live URL once");
console.log("Vercel gives you one, then redeploy so the sitemap and the share");
console.log("previews point at the right place.");
