import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { admin, clientKey, hashToken, isConfigured, rateLimit } from "@/lib/supabase";
import { InvalidInput, parsePayload } from "@/lib/validate";

/**
 * Start a letter. The row is created as an unpublished draft so that media
 * uploads have something to attach to and to be checked against.
 *
 * The owner token is returned exactly once, here. Only its hash is stored.
 */
export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }

  const limit = rateLimit(`create:${clientKey(request)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many letters from this connection. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let payload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    const message = error instanceof InvalidInput ? error.message : "The letter is malformed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const id = nanoid(22);
  const ownerToken = nanoid(32);

  const { error } = await admin().from("letters").insert({
    id,
    owner_token_hash: hashToken(ownerToken),
    payload,
    published: false,
  });

  if (error) {
    console.error("letters.insert failed", error.message);
    return NextResponse.json({ error: "The letter could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ id, ownerToken }, { status: 201 });
}
