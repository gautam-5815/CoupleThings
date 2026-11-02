"use client";

import { useState } from "react";
import type { Experience } from "@/lib/experience";

const TONES = ["sincere", "romantic", "emotional", "cute", "playful"] as const;

export type Notes = {
  tone: (typeof TONES)[number];
  feelings: string;
  memories: string;
  promise: string;
};

export const emptyNotes: Notes = {
  tone: "sincere",
  feelings: "",
  memories: "",
  promise: "",
};

/**
 * Optional drafting help. It only ever rearranges what the sender types here,
 * and every line it produces lands in the normal editor to be changed. The
 * letter can be written without ever opening this.
 */
export default function WritingHelp({
  letter,
  notes,
  onNotes,
  onDrafted,
}: {
  letter: Experience;
  notes: Notes;
  onNotes: (notes: Notes) => void;
  onDrafted: (pages: Record<number, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function draft() {
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: letter.to,
          from: letter.from,
          occasion: letter.occasion,
          ...notes,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (response.status === 501) {
        setProblem(
          "Writing help is not switched on here. Add an OpenAI key to .env.local, or just write the pages yourself.",
        );
        return;
      }
      if (!response.ok) {
        setProblem(typeof body.error === "string" ? body.error : "That did not work.");
        return;
      }

      onDrafted(body.pages as Record<number, string>);
      setOpen(false);
    } catch {
      setProblem("That did not work. Write the pages yourself, or try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div style={{ display: "grid", gap: "0.6rem", justifyItems: "start" }}>
        <button className="btn btn-plain" onClick={() => setOpen(true)}>
          Help me start the words
        </button>
        <p className="small ink-muted" style={{ maxWidth: "52ch" }}>
          Optional. It only uses what you tell it, and you can change every line afterwards.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--paper-step)", padding: "clamp(1rem, 3vw, 1.75rem)", display: "grid", gap: "1.25rem" }}>
      <p style={{ fontWeight: 500 }}>Tell it about the two of you.</p>

      {problem && (
        <p role="alert" className="small" style={{ background: "var(--accent)", color: "var(--accent-ink)", padding: "0.7rem 0.9rem" }}>
          {problem}
        </p>
      )}

      <label style={{ display: "grid", gap: "0.4rem" }}>
        <span className="small ink-muted">How it should sound</span>
        <select
          value={notes.tone}
          onChange={(e) => onNotes({ ...notes, tone: e.target.value as Notes["tone"] })}
          style={field}
        >
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {(
        [
          ["feelings", "What you want them to understand", "I was short with you on Tuesday and I have felt bad about it since…"],
          ["memories", "Something real about the two of you", "The trip to Lonavala, the way she makes chai, her laugh at bad jokes…"],
          ["promise", "What you are promising, if anything", "I will say when I am tired instead of taking it out on her…"],
        ] as const
      ).map(([key, label, placeholder]) => (
        <label key={key} style={{ display: "grid", gap: "0.4rem" }}>
          <span className="small ink-muted">{label}</span>
          <textarea
            value={notes[key]}
            maxLength={1500}
            placeholder={placeholder}
            onChange={(e) => onNotes({ ...notes, [key]: e.target.value })}
            style={{ ...field, minHeight: "5.5rem", lineHeight: 1.5, resize: "vertical" }}
          />
        </label>
      ))}

      <p className="small ink-muted" style={{ maxWidth: "54ch" }}>
        It will not invent a memory you did not mention. Anything it writes is a first draft in
        your own editor, not a finished letter.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={draft} disabled={busy}>
          {busy ? "Drafting…" : "Draft the first four pages"}
        </button>
        <button className="btn btn-plain" onClick={() => setOpen(false)} disabled={busy}>
          Close
        </button>
      </div>
    </div>
  );
}

const field: React.CSSProperties = {
  font: "inherit",
  fontSize: "var(--step-body)",
  padding: "0.7rem 0.9rem",
  background: "var(--paper)",
  color: "var(--ink)",
  border: 0,
  borderRadius: "var(--radius)",
  width: "100%",
};
