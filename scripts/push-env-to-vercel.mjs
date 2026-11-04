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

function run(args) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["--yes", "vercel", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});
    child.on("close", resolve);
  });
}

function add(name, value, target) {
  return new Promise((resolve) => {
    // Windows needs a shell to run npx.cmd; Node refuses to spawn it directly.
    const child = spawn("npx", ["--yes", "vercel", "env", "add", name, target], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

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

// The live site has a different address from your machine, so the public
// site URL is passed in rather than copied from .env.local:
//   node scripts/push-env-to-vercel.mjs --site-url https://your-app.vercel.app
const flag = process.argv.indexOf("--site-url");
const siteUrl = flag > -1 ? process.argv[flag + 1]?.trim() : null;

if (siteUrl) {
  try {
    new URL(siteUrl);
  } catch {
    console.log(`"${siteUrl}" is not a valid URL.`);
    process.exit(1);
  }
}

console.log("Copying secrets from .env.local into Vercel.\n");

for (const name of WANTED) {
  const isSiteUrl = name === "NEXT_PUBLIC_SITE_URL";

  for (const target of TARGETS) {
    // Production and preview get the live address; development keeps
    // whatever .env.local says, which is your own machine.
    const value = isSiteUrl && siteUrl && target !== "development" ? siteUrl : values[name];

    if (!value) {
      console.log(`  ${name} -> ${target}: no value, skipped`);
      continue;
    }

    // Replace rather than skip, so re-running this syncs an edited value
    // instead of silently leaving the old one in place.
    await run(["env", "rm", name, target, "--yes"]);
    await add(name, value, target);
  }
}

console.log("\nDone. Remember to set NEXT_PUBLIC_SITE_URL to the live URL once");
console.log("Vercel gives you one, then redeploy so the sitemap and the share");
console.log("previews point at the right place.");
