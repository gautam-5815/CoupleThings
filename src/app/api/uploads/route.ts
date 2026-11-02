import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  MEDIA_BUCKET,
  admin,
  clientKey,
  isConfigured,
  rateLimit,
  tokenMatches,
} from "@/lib/supabase";
import { parseId, parseToken } from "@/lib/validate";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Accepted types, with the extension we will store. The browser's declared
 * type is only a hint, so the first bytes of the file are checked against it
 * below: a renamed executable must not land in the bucket as an "image".
 */
const TYPES: Record<string, { ext: string; magic: number[][] }> = {
  "image/jpeg": { ext: "jpg", magic: [[0xff, 0xd8, 0xff]] },
  "image/png": { ext: "png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/gif": { ext: "gif", magic: [[0x47, 0x49, 0x46, 0x38]] },
  "image/webp": { ext: "webp", magic: [[0x52, 0x49, 0x46, 0x46]] },
  "audio/mpeg": { ext: "mp3", magic: [[0x49, 0x44, 0x33], [0xff, 0xfb], [0xff, 0xf3], [0xff, 0xf2]] },
  "audio/ogg": { ext: "ogg", magic: [[0x4f, 0x67, 0x67, 0x53]] },
  "audio/wav": { ext: "wav", magic: [[0x52, 0x49, 0x46, 0x46]] },
  "audio/mp4": { ext: "m4a", magic: [[0x66, 0x74, 0x79, 0x70]] },
};

function looksLike(bytes: Uint8Array, magic: number[][]) {
  return magic.some((signature) =>
    // mp4/m4a carries its marker at offset 4
    [0, 4].some((offset) =>
      signature.every((byte, i) => bytes[offset + i] === byte),
    ),
  );
}

/** Attach one file to a letter the caller can prove they own. */
export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }

  const limit = rateLimit(`upload:${clientKey(request)}`, 60, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  let id: string;
  let token: string;
  try {
    id = parseId(form.get("id"));
    token = parseToken(form.get("ownerToken"));
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is ${(file.size / 1e6).toFixed(1)} MB. The limit is 8 MB.` },
      { status: 413 },
    );
  }

  const kind = TYPES[file.type];
  if (!kind) {
    return NextResponse.json(
      { error: "That file type is not allowed. Use JPEG, PNG, WebP, GIF, MP3, OGG, WAV or M4A." },
      { status: 415 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLike(bytes, kind.magic)) {
    return NextResponse.json(
      { error: "That file's contents do not match its type." },
      { status: 415 },
    );
  }

  // Prove ownership of the letter before writing into its folder.
  const { data, error: lookupError } = await admin()
    .from("letters")
    .select("owner_token_hash")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    console.error("letters.select failed", lookupError.message);
    return NextResponse.json({ error: "The file could not be saved." }, { status: 500 });
  }
  if (!data || !tokenMatches(token, (data as { owner_token_hash: string }).owner_token_hash)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const path = `${id}/${nanoid(16)}.${kind.ext}`;
  const { error } = await admin()
    .storage.from(MEDIA_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error("storage.upload failed", error.message);
    return NextResponse.json({ error: "The file could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ path }, { status: 201 });
}
