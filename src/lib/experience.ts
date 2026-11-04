import { nanoid } from "nanoid";

export type Occasion = "apology" | "love" | "anniversary" | "birthday" | "custom";

export type Leaf = {
  /** The words on this page. Always the sender's, editable. */
  text: string;
  /** Where the picture lives in storage. This is what gets saved. */
  imagePath?: string;
  imageAlt?: string;
  /** Where the track lives in storage. This is what gets saved. */
  audioPath?: string;
  audioTitle?: string;
  /**
   * Playable URLs for this render only: a signed URL from the server, or a
   * data URL in browser-only mode. Never persisted, because signed URLs
   * expire within the hour.
   */
  image?: string;
  audio?: string;
};

export type Experience = {
  id: string;
  /** Held only by the sender. Proves ownership for editing and deleting. */
  ownerToken: string;
  createdAt: string;
  from: string;
  to: string;
  occasion: Occasion;
  leaves: [Leaf, Leaf, Leaf, Leaf, Leaf];
  question: string;
  yesLabel: string;
  noLabel: string;
  closing: string;
  published: boolean;
  /**
   * True once the letter has a row of its own in the database. Until then it
   * lives only in this browser, and the interface says so.
   */
  remote: boolean;
};

export const occasions: { value: Occasion; label: string; opener: string }[] = [
  { value: "apology", label: "An apology", opener: "I owe you a proper sorry, so I wrote it down." },
  { value: "love", label: "Just to say I love you", opener: "No occasion. I just wanted you to read this." },
  { value: "anniversary", label: "An anniversary", opener: "A year of us, written down before I forget any of it." },
  { value: "birthday", label: "A birthday", opener: "Happy birthday. Here is the long version." },
  { value: "custom", label: "Something else", opener: "There is something I have wanted to tell you." },
];

export const leafTitles = [
  "The opening",
  "The memory",
  "The letter",
  "The promise",
  "The question",
] as const;

export const leafPrompts = [
  "How you want to start. One or two sentences.",
  "A memory, and the photograph that goes with it.",
  "The thing you actually want to say. Take your time.",
  "One promise you mean, in your own words.",
  "This page carries the question below.",
] as const;

/** An id long enough that it cannot be guessed or enumerated. */
export function newId() {
  return nanoid(22);
}

export function emptyExperience(to = "", occasion: Occasion = "apology"): Experience {
  const chosen = occasions.find((o) => o.value === occasion) ?? occasions[0];
  return {
    id: newId(),
    ownerToken: nanoid(32),
    createdAt: new Date().toISOString(),
    from: "",
    to,
    occasion,
    leaves: [
      { text: chosen.opener },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "" },
    ],
    question: "Will you let me make it up to you?",
    yesLabel: "Yes",
    noLabel: "Not yet",
    closing: "Thank you for reading all of it.",
    published: false,
    remote: false,
  };
}

/* ------------------------------------------------------------------
   Browser-only storage.
   The fallback used when no Supabase project is configured: letters
   stay in the sender's own browser, so a link only opens on the device
   that wrote it. src/lib/letters.ts chooses between this and the
   server-backed store.
   ------------------------------------------------------------------ */

const KEY = "couple-things/letters";

type Store = Record<string, Experience>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded, or storage blocked. The caller reports it.
    throw new Error("This letter is too large to save in this browser.");
  }
}

export function saveExperience(experience: Experience) {
  const store = read();
  store[experience.id] = experience;
  write(store);
}

export function loadExperience(id: string): Experience | null {
  return read()[id] ?? null;
}

export function deleteExperience(id: string) {
  const store = read();
  delete store[id];
  write(store);
}

export function listMine(): Experience[] {
  return Object.values(read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
