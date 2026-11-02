import type { Experience, Leaf, Occasion } from "./experience";

/**
 * Hand-rolled validation for anything arriving from a browser. Every field is
 * length-capped so one caller cannot push a huge row into the database, and
 * media is accepted only as a storage path this app itself handed out.
 */

export const LIMITS = {
  name: 32,
  to: 24,
  text: 1200,
  question: 120,
  label: 24,
  closing: 120,
  alt: 160,
  audioTitle: 80,
  path: 200,
} as const;

const OCCASIONS: Occasion[] = ["apology", "love", "anniversary", "birthday", "custom"];

export class InvalidInput extends Error {}

function str(value: unknown, max: number, field: string, required = false): string {
  if (value === undefined || value === null) {
    if (required) throw new InvalidInput(`${field} is required.`);
    return "";
  }
  if (typeof value !== "string") throw new InvalidInput(`${field} must be text.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new InvalidInput(`${field} is required.`);
  if (trimmed.length > max) throw new InvalidInput(`${field} is too long.`);
  return trimmed;
}

/** Storage paths are ours: "<letterId>/<nanoid>.<ext>" and nothing else. */
function mediaPath(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const path = str(value, LIMITS.path, field);
  if (!/^[A-Za-z0-9_-]{6,40}\/[A-Za-z0-9_-]{6,40}\.[A-Za-z0-9]{2,5}$/.test(path)) {
    throw new InvalidInput(`${field} is not a path this app issued.`);
  }
  return path;
}

function leaf(value: unknown, index: number): Leaf {
  if (typeof value !== "object" || value === null) {
    throw new InvalidInput(`Page ${index + 1} is malformed.`);
  }
  const raw = value as Record<string, unknown>;
  return {
    text: str(raw.text, LIMITS.text, `Page ${index + 1}`),
    imagePath: mediaPath(raw.imagePath, `Page ${index + 1} photograph`),
    imageAlt: str(raw.imageAlt, LIMITS.alt, `Page ${index + 1} description`) || undefined,
    audioPath: mediaPath(raw.audioPath, `Page ${index + 1} track`),
    audioTitle: str(raw.audioTitle, LIMITS.audioTitle, `Page ${index + 1} track name`) || undefined,
  };
}

/** The shape stored in the database. Ids and tokens are handled separately. */
export type StoredPayload = Omit<Experience, "id" | "ownerToken" | "published" | "createdAt">;

export function parsePayload(input: unknown): StoredPayload {
  if (typeof input !== "object" || input === null) {
    throw new InvalidInput("The letter is malformed.");
  }
  const raw = input as Record<string, unknown>;

  const occasion = String(raw.occasion ?? "apology") as Occasion;
  if (!OCCASIONS.includes(occasion)) throw new InvalidInput("Unknown occasion.");

  const leaves = raw.leaves;
  if (!Array.isArray(leaves) || leaves.length !== 5) {
    throw new InvalidInput("A letter has exactly five pages.");
  }

  return {
    from: str(raw.from, LIMITS.name, "Your name"),
    to: str(raw.to, LIMITS.to, "Who it is for", true),
    occasion,
    leaves: leaves.map(leaf) as StoredPayload["leaves"],
    question: str(raw.question, LIMITS.question, "The question", true),
    yesLabel: str(raw.yesLabel, LIMITS.label, "The yes button") || "Yes",
    noLabel: str(raw.noLabel, LIMITS.label, "The other button") || "Not yet",
    closing: str(raw.closing, LIMITS.closing, "The closing") || "Thank you for reading all of it.",
  };
}

export function parseToken(value: unknown): string {
  const token = str(value, 64, "Owner token", true);
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) throw new InvalidInput("Owner token is malformed.");
  return token;
}

export function parseId(value: unknown): string {
  const id = str(value, 40, "Letter id", true);
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(id)) throw new InvalidInput("Letter id is malformed.");
  return id;
}
