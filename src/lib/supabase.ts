import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The service-role client. It bypasses Row Level Security, so it exists only
 * on the server and only inside API routes. The "server-only" import above
 * makes the build fail if a client component ever reaches for this file.
 */
/**
 * Trimmed, because tools that set environment variables leave whitespace
 * behind: `vercel env add` keeps a trailing newline, and a pasted value can
 * carry a byte-order mark. A key with a stray newline fails in ways that
 * look nothing like the real cause.
 */
function envValue(name: string) {
  return process.env[name]?.replace(/^﻿/, "").trim() || undefined;
}

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = envValue("SUPABASE_SERVICE_ROLE_KEY");

export const MEDIA_BUCKET = "letter-media";

export function isConfigured() {
  return Boolean(url && serviceKey);
}

let cached: SupabaseClient | null = null;

export function admin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error("Supabase is not configured on this deployment.");
  }
  cached ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** The owner token is only ever stored as a hash. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare, so a wrong token cannot be found by timing it. */
export function tokenMatches(token: string, expectedHash: string) {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------
   A small rate limiter, kept in memory.
   It is deliberately modest: it holds back a script hammering one
   instance. It resets on redeploy and does not span instances, so it
   is a speed bump, not a wall. Supabase's own limits sit behind it.
   ------------------------------------------------------------------ */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
