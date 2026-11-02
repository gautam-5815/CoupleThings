import { NextResponse } from "next/server";
import "server-only";
import { clientKey, rateLimit } from "@/lib/supabase";

/**
 * Drafting help. The key lives only here, on the server.
 *
 * The rule this route exists to enforce: the model may only rearrange and
 * phrase what the sender actually typed. It must not invent a memory, a date,
 * a place or a promise, because a letter containing a thing that never
 * happened is worse than no letter at all.
 */

const MAX = {
  name: 32,
  tone: 24,
  long: 1500,
} as const;

const TONES = ["cute", "romantic", "emotional", "sincere", "playful"] as const;

const SECTIONS = [
  "the opening: how the letter begins, warm and direct",
  "the memory: the shared memory they described",
  "the letter: the main thing they want to say",
  "the promise: the promise or gesture they offered",
] as const;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }

  const limit = rateLimit(`generate:${clientKey(request)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That is a lot of drafts. Try again in a little while." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const to = clean(body.to, MAX.name);
  const from = clean(body.from, MAX.name);
  const occasion = clean(body.occasion, MAX.tone) || "apology";
  const tone = TONES.includes(clean(body.tone, MAX.tone) as (typeof TONES)[number])
    ? clean(body.tone, MAX.tone)
    : "sincere";
  const feelings = clean(body.feelings, MAX.long);
  const memories = clean(body.memories, MAX.long);
  const promise = clean(body.promise, MAX.long);

  if (!feelings && !memories && !promise) {
    return NextResponse.json(
      { error: "Tell it something about the two of you first, and it will draft from that." },
      { status: 400 },
    );
  }

  const only = typeof body.section === "number" ? Math.trunc(body.section) : null;
  const wanted = only !== null && only >= 0 && only < 4 ? [only] : [0, 1, 2, 3];

  const system = [
    "You help someone write a short private letter to their partner.",
    "",
    "Hard rules:",
    "- Use ONLY the facts the sender gave. Never invent a memory, a place, a date, a gift, a nickname or a promise.",
    "- If they gave you little, write something short and honest rather than padding it with invented detail.",
    "- Write in the sender's own first person, speaking directly to the recipient as 'you'.",
    "- No greeting line and no sign-off: the page already shows both names.",
    "- Plain words. No clichés about hearts, stars, journeys, oceans or forever.",
    "- Two to four sentences per page. Never more.",
    "- Return plain text only. No markdown, no quotation marks around the whole thing, no emoji.",
  ].join("\n");

  const facts = [
    `Occasion: ${occasion}`,
    `Tone they asked for: ${tone}`,
    to && `Recipient's name: ${to}`,
    from && `Sender's name: ${from}`,
    feelings && `What the sender feels, in their words: ${feelings}`,
    memories && `Shared memories and details they gave: ${memories}`,
    promise && `The promise they want to make: ${promise}`,
  ]
    .filter(Boolean)
    .join("\n");

  const task =
    wanted.length === 1
      ? `Write ONLY this page: ${SECTIONS[wanted[0]]}. Return a JSON object {"pages":{"${wanted[0]}":"..."}}.`
      : `Write these four pages:\n${wanted
          .map((i) => `${i}. ${SECTIONS[i]}`)
          .join("\n")}\nReturn a JSON object {"pages":{"0":"...","1":"...","2":"...","3":"..."}}.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${facts}\n\n${task}` },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("openai failed", response.status, detail.slice(0, 300));
      return NextResponse.json(
        {
          error:
            response.status === 401
              ? "The writing help is not set up correctly on this deployment."
              : "The writing help is busy. Write the page yourself, or try again shortly.",
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { pages?: Record<string, unknown> };

    const pages: Record<number, string> = {};
    for (const index of wanted) {
      const text = parsed.pages?.[String(index)];
      if (typeof text === "string" && text.trim()) {
        pages[index] = text.trim().slice(0, 1200);
      }
    }

    if (Object.keys(pages).length === 0) {
      return NextResponse.json(
        { error: "Nothing usable came back. Try again, or write it yourself." },
        { status: 502 },
      );
    }

    return NextResponse.json({ pages }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("generate failed", error);
    return NextResponse.json(
      { error: "The writing help did not answer. Write the page yourself, or try again." },
      { status: 502 },
    );
  }
}
