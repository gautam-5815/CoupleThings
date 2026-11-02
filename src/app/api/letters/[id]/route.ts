import { NextResponse } from "next/server";
import {
  MEDIA_BUCKET,
  admin,
  clientKey,
  isConfigured,
  rateLimit,
  tokenMatches,
} from "@/lib/supabase";
import { InvalidInput, parseId, parsePayload, parseToken } from "@/lib/validate";
import type { StoredPayload } from "@/lib/validate";

const SIGNED_URL_SECONDS = 60 * 60;

type Row = {
  id: string;
  owner_token_hash: string;
  payload: StoredPayload;
  published: boolean;
  created_at: string;
};

function unconfigured() {
  return NextResponse.json({ error: "not-configured" }, { status: 501 });
}

async function fetchRow(id: string) {
  const { data, error } = await admin()
    .from("letters")
    .select("id, owner_token_hash, payload, published, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("letters.select failed", error.message);
    return { row: null, failed: true };
  }
  return { row: (data as Row | null) ?? null, failed: false };
}

/** Swap stored storage paths for short-lived signed URLs. */
async function withSignedMedia(payload: StoredPayload) {
  const paths = payload.leaves
    .flatMap((leaf) => [leaf.imagePath, leaf.audioPath])
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return payload;

  const { data, error } = await admin()
    .storage.from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);

  if (error) {
    console.error("storage.createSignedUrls failed", error.message);
    return payload;
  }

  const signed = new Map<string, string>();
  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  });

  return {
    ...payload,
    leaves: payload.leaves.map((leaf) => ({
      ...leaf,
      image: leaf.imagePath ? signed.get(leaf.imagePath) : undefined,
      audio: leaf.audioPath ? signed.get(leaf.audioPath) : undefined,
    })) as StoredPayload["leaves"],
  };
}

/**
 * Read a letter. The long random id is the only credential a reader needs,
 * which is what makes the link shareable without an account. An unpublished
 * draft is visible only to whoever holds the owner token.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return unconfigured();

  const limit = rateLimit(`read:${clientKey(request)}`, 240, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let id: string;
  try {
    id = parseId((await context.params).id);
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const { row, failed } = await fetchRow(id);
  if (failed) return NextResponse.json({ error: "Could not be read." }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not-found" }, { status: 404 });

  if (!row.published) {
    const token = new URL(request.url).searchParams.get("token");
    if (!token || !tokenMatches(token, row.owner_token_hash)) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
  }

  const payload = await withSignedMedia(row.payload);

  return NextResponse.json(
    { id: row.id, createdAt: row.created_at, published: row.published, ...payload },
    // A private letter is never cached by a shared cache, and the signed
    // URLs inside it expire anyway.
    { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}

/** Edit or publish. Requires the owner token. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return unconfigured();

  const limit = rateLimit(`write:${clientKey(request)}`, 120, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let id: string;
  let token: string;
  let payload: StoredPayload;
  let published: boolean | undefined;

  try {
    id = parseId((await context.params).id);
    const body = (await request.json()) as Record<string, unknown>;
    token = parseToken(body.ownerToken);
    payload = parsePayload(body.payload);
    published = typeof body.published === "boolean" ? body.published : undefined;
  } catch (error) {
    const message = error instanceof InvalidInput ? error.message : "That request was malformed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { row, failed } = await fetchRow(id);
  if (failed) return NextResponse.json({ error: "Could not be saved." }, { status: 500 });
  if (!row || !tokenMatches(token, row.owner_token_hash)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const { error } = await admin()
    .from("letters")
    .update({ payload, ...(published === undefined ? {} : { published }) })
    .eq("id", id);

  if (error) {
    console.error("letters.update failed", error.message);
    return NextResponse.json({ error: "The letter could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, published: published ?? row.published });
}

/** Delete the letter and every file that belonged to it. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return unconfigured();

  let id: string;
  let token: string;
  try {
    id = parseId((await context.params).id);
    token = parseToken(new URL(request.url).searchParams.get("token"));
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const { row, failed } = await fetchRow(id);
  if (failed) return NextResponse.json({ error: "Could not be deleted." }, { status: 500 });
  if (!row || !tokenMatches(token, row.owner_token_hash)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const paths = row.payload.leaves
    .flatMap((leaf) => [leaf.imagePath, leaf.audioPath])
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    const { error } = await admin().storage.from(MEDIA_BUCKET).remove(paths);
    if (error) console.error("storage.remove failed", error.message);
  }

  const { error } = await admin().from("letters").delete().eq("id", id);
  if (error) {
    console.error("letters.delete failed", error.message);
    return NextResponse.json({ error: "The letter could not be deleted." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
