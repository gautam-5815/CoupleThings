"use client";

import {
  deleteExperience,
  loadExperience,
  saveExperience,
  type Experience,
  type Leaf,
} from "./experience";

/**
 * The one place the app asks for a letter.
 *
 * With a Supabase project configured, letters live on the server and a link
 * opens anywhere. Without one, everything falls back to the sender's own
 * browser so the app still works, and says so plainly in the interface.
 */
/**
 * The browser can only see the public URL, but the server also needs a
 * service-role key. So "is the database live?" cannot be answered here with
 * certainty: a project URL with no key behind it looks configured and is not.
 *
 * Rather than guess, we assume remote when a URL is set and step down to the
 * browser store the first time a route answers "not-configured". That way a
 * half-filled .env.local degrades to a working app instead of a dead button.
 */
const urlPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

let serverUnavailable = false;

export function remoteActive() {
  return urlPresent && !serverUnavailable;
}

/** Kept for components that only need the rough answer for their wording. */
export const remoteEnabled = urlPresent;

/** True once a route has told us the server side is not set up. */
export function fellBackToThisDevice() {
  return urlPresent && serverUnavailable;
}

class NotConfigured extends Error {}

function stepDown() {
  serverUnavailable = true;
  if (typeof console !== "undefined") {
    console.warn(
      "Couple Things: the database is not configured on the server, so letters are being kept in this browser instead.",
    );
  }
}

/* ---------- the sender's own keys, kept only on their device ---------- */

const TOKENS = "couple-things/tokens";

type TokenMap = Record<string, string>;

function tokens(): TokenMap {
  try {
    return JSON.parse(window.localStorage.getItem(TOKENS) ?? "{}") as TokenMap;
  } catch {
    return {};
  }
}

export function rememberToken(id: string, token: string) {
  try {
    window.localStorage.setItem(TOKENS, JSON.stringify({ ...tokens(), [id]: token }));
  } catch {
    // Storage is blocked. The sender still has the token on screen.
  }
}

export function ownerTokenFor(id: string): string | null {
  return tokens()[id] ?? null;
}

export function forgetToken(id: string) {
  const map = tokens();
  delete map[id];
  try {
    window.localStorage.setItem(TOKENS, JSON.stringify(map));
  } catch {
    /* nothing to do */
  }
}

/* ---------- talking to the server ---------- */

export class LetterError extends Error {}

async function unwrap(response: Response) {
  const body = await response.json().catch(() => ({}));

  if (response.status === 501 || body?.error === "not-configured") {
    throw new NotConfigured();
  }

  if (!response.ok) {
    const message = typeof body.error === "string" ? body.error : "";
    throw new LetterError(
      message && message !== "not-found" && message !== "not-configured"
        ? message
        : "That letter could not be found.",
    );
  }
  return body;
}

/** The fields the server stores. Playable URLs are stripped out. */
function toPayload(letter: Experience) {
  return {
    from: letter.from,
    to: letter.to,
    occasion: letter.occasion,
    question: letter.question,
    yesLabel: letter.yesLabel,
    noLabel: letter.noLabel,
    closing: letter.closing,
    leaves: letter.leaves.map((leaf) => ({
      text: leaf.text,
      imagePath: leaf.imagePath,
      imageAlt: leaf.imageAlt,
      audioPath: leaf.audioPath,
      audioTitle: leaf.audioTitle,
    })),
  };
}

/**
 * Begin a letter. This deliberately touches nothing but this device: the
 * database is not asked for anything until there is something worth storing.
 * Writing the first page should never fail because a server is unwell.
 */
export async function startLetter(letter: Experience): Promise<Experience> {
  saveExperience(letter);
  return letter;
}

/**
 * Make sure the letter has a row of its own, creating one the first time it
 * is really needed: when a file must be attached to it, or when it is
 * published. Returns the letter as it now stands, which carries the server's
 * id and owner token once a row exists.
 *
 * If the database cannot take it, this does NOT throw. The letter stays on
 * this device and `remote` stays false, so the caller can say so plainly
 * instead of losing what someone has written.
 */
export async function ensureRemote(letter: Experience): Promise<Experience> {
  if (!remoteActive() || letter.remote) return letter;

  try {
    const body = await unwrap(
      await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(letter)),
      }),
    );
    rememberToken(body.id, body.ownerToken);
    return { ...letter, id: body.id, ownerToken: body.ownerToken, remote: true };
  } catch (error) {
    if (error instanceof NotConfigured) stepDown();
    else lastRemoteProblem = error instanceof Error ? error.message : "The database refused it.";
    return letter;
  }
}

/** Why the last remote attempt failed, for the interface to repeat honestly. */
let lastRemoteProblem: string | null = null;

export function remoteProblem() {
  return lastRemoteProblem;
}

export async function saveLetter(letter: Experience, published?: boolean): Promise<Experience> {
  const next = published === undefined ? letter : { ...letter, published };

  if (remoteActive() && letter.remote) {
    try {
      await unwrap(
        await fetch(`/api/letters/${encodeURIComponent(letter.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerToken: letter.ownerToken,
            payload: toPayload(letter),
            ...(published === undefined ? {} : { published }),
          }),
        }),
      );
      lastRemoteProblem = null;
      return next;
    } catch (error) {
      if (error instanceof NotConfigured) stepDown();
      else {
        // Keep the writing. Say so rather than throwing it away.
        lastRemoteProblem = error instanceof Error ? error.message : "The database refused it.";
        saveExperience({ ...next, remote: false });
        return { ...next, remote: false };
      }
    }
  }

  saveExperience(next);
  return next;
}

export async function fetchLetter(id: string): Promise<Experience | null> {
  if (!remoteActive()) return loadExperience(id);

  const token = ownerTokenFor(id);
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  let body;
  try {
    const response = await fetch(`/api/letters/${encodeURIComponent(id)}${query}`, {
      cache: "no-store",
    });
    // Not in the database: it may still be a letter kept on this device,
    // either written before the database was set up or saved here when it
    // refused. Look there before giving up.
    if (response.status === 404) return loadExperience(id);
    body = await unwrap(response);
  } catch (error) {
    if (error instanceof NotConfigured) stepDown();
    else lastRemoteProblem = error instanceof Error ? error.message : "The database did not answer.";

    // The database could not answer. A copy may still be on this device,
    // either written before it was set up or kept here when it refused.
    return loadExperience(id);
  }

  return {
    id: body.id,
    ownerToken: token ?? "",
    createdAt: body.createdAt,
    published: body.published,
    remote: true,
    from: body.from,
    to: body.to,
    occasion: body.occasion,
    leaves: body.leaves as Experience["leaves"],
    question: body.question,
    yesLabel: body.yesLabel,
    noLabel: body.noLabel,
    closing: body.closing,
  };
}

export async function removeLetter(letter: Experience): Promise<void> {
  if (remoteActive()) {
    try {
      await unwrap(
        await fetch(
          `/api/letters/${encodeURIComponent(letter.id)}?token=${encodeURIComponent(letter.ownerToken)}`,
          { method: "DELETE" },
        ),
      );
      forgetToken(letter.id);
      return;
    } catch (error) {
      if (!(error instanceof NotConfigured)) throw error;
      stepDown();
    }
  }

  deleteExperience(letter.id);
  forgetToken(letter.id);
}

/**
 * Put one file where the letter can reach it. Remotely that is a private
 * bucket and we keep the path; locally there is nowhere to put it, so the
 * file is inlined as a data URL and stays on this device.
 */
export async function uploadMedia(
  letter: Experience,
  file: File,
  kind: "image" | "audio",
): Promise<Partial<Leaf>> {
  if (remoteActive() && letter.remote) {
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("id", letter.id);
      form.set("ownerToken", letter.ownerToken);

      const body = await unwrap(await fetch("/api/uploads", { method: "POST", body: form }));
      const preview = URL.createObjectURL(file);

      return kind === "image"
        ? { imagePath: body.path, image: preview, imageAlt: file.name }
        : { audioPath: body.path, audio: preview, audioTitle: file.name.replace(/\.[^.]+$/, "") };
    } catch (error) {
      if (!(error instanceof NotConfigured)) throw error;
      stepDown();
    }
  }

  // No server to hold it, so the file stays on this device as a data URL.
  const limit = kind === "image" ? 2_500_000 : 4_000_000;
  if (file.size > limit) {
    throw new LetterError(
      `That file is ${(file.size / 1e6).toFixed(1)} MB. Without a database, the limit here is ${(limit / 1e6).toFixed(1)} MB.`,
    );
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new LetterError("That file could not be read."));
    reader.readAsDataURL(file);
  });

  return kind === "image"
    ? { image: dataUrl, imagePath: undefined, imageAlt: file.name }
    : { audio: dataUrl, audioPath: undefined, audioTitle: file.name.replace(/\.[^.]+$/, "") };
}
