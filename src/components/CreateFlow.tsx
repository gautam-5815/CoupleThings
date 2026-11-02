"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  emptyExperience,
  leafPrompts,
  leafTitles,
  occasions,
  type Experience,
  type Occasion,
} from "@/lib/experience";
import {
  LetterError,
  remoteActive,
  removeLetter,
  saveLetter,
  startLetter,
  uploadMedia,
} from "@/lib/letters";
import WritingHelp, { emptyNotes, type Notes } from "./WritingHelp";

const steps = ["Who it is for", "The five pages", "The question", "Send it"] as const;

export default function CreateFlow() {
  const params = useSearchParams();
  const [letter, setLetter] = useState<Experience | null>(null);
  const [step, setStep] = useState(0);
  const [leafIndex, setLeafIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Notes>(emptyNotes);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setLetter(emptyExperience(params.get("for")?.slice(0, 24) ?? ""));
    setOrigin(window.location.origin);
  }, [params]);

  if (!letter) return <main style={{ padding: "var(--margin)" }}>Loading…</main>;

  if (deleted) {
    return (
      <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "var(--margin)" }}>
        <div style={{ display: "grid", gap: "1.5rem", maxWidth: "44ch" }}>
          <h1 className="head">It is gone.</h1>
          <p>
            The letter, its photographs and its music have been deleted, and the link no longer
            opens anything.
          </p>
          <Link className="btn" href="/create">
            Write another
          </Link>
        </div>
      </main>
    );
  }

  function update(patch: Partial<Experience>) {
    setLetter((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateLeaf(index: number, patch: Partial<Experience["leaves"][number]>) {
    setLetter((prev) => {
      if (!prev) return prev;
      const leaves = [...prev.leaves] as Experience["leaves"];
      leaves[index] = { ...leaves[index], ...patch };
      return { ...prev, leaves };
    });
  }

  function report(e: unknown) {
    setError(
      e instanceof LetterError || e instanceof Error
        ? e.message
        : "Something went wrong. Please try again.",
    );
  }

  /** Create the draft row first, so uploads have a letter to belong to. */
  async function begin() {
    setBusy(true);
    try {
      setLetter(await startLetter(letter!));
      setStep(1);
      setError(null);
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }

  async function attach(file: File, kind: "image" | "audio") {
    setBusy(true);
    try {
      updateLeaf(leafIndex, await uploadMedia(letter!, file, kind));
      setError(null);
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    try {
      setLetter(await saveLetter(letter!, true));
      setStep(3);
      setError(null);
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }

  const link = `${origin}/l/${letter.id}`;

  return (
    <main style={{ minHeight: "100svh", paddingBlock: "clamp(2rem, 5vw, 4rem)" }}>
      <div className="wrap" style={{ display: "grid", gap: "2.5rem", maxWidth: "60rem" }}>
        <header style={{ display: "grid", gap: "1rem" }}>
          <Link href="/" className="small">
            Couple Things
          </Link>
          <h1 className="head">{steps[step]}</h1>
          <p className="small ink-muted">
            Step {step + 1} of {steps.length}. Nothing leaves this browser until you choose to
            share the link.
          </p>
        </header>

        {error && (
          <p role="alert" style={{ background: "var(--accent)", color: "var(--accent-ink)", padding: "0.9rem 1.1rem" }}>
            {error}
          </p>
        )}

        {notice && (
          <p role="status" style={{ background: "var(--paper-step)", padding: "0.9rem 1.1rem" }}>
            {notice}
          </p>
        )}

        {/* ---------- 1. who ---------- */}
        {step === 0 && (
          <section style={{ display: "grid", gap: "1.75rem", maxWidth: "36rem" }}>
            <Field label="Your name">
              <input
                style={inputStyle}
                value={letter.from}
                maxLength={32}
                onChange={(e) => update({ from: e.target.value })}
                placeholder="What they call you"
              />
            </Field>

            <Field label="Who it is for">
              <input
                style={inputStyle}
                value={letter.to}
                maxLength={24}
                onChange={(e) => update({ to: e.target.value })}
                placeholder="Their name, or your name for them"
              />
            </Field>

            <fieldset style={{ border: 0, padding: 0, display: "grid", gap: "0.75rem" }}>
              <legend className="small ink-muted" style={{ marginBottom: "0.5rem" }}>
                What is this letter?
              </legend>
              {occasions.map((o) => (
                <label key={o.value} style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
                  <input
                    type="radio"
                    name="occasion"
                    checked={letter.occasion === o.value}
                    onChange={() => {
                      const next = emptyExperience(letter.to, o.value as Occasion);
                      update({ occasion: o.value, leaves: [{ ...letter.leaves[0], text: next.leaves[0].text }, letter.leaves[1], letter.leaves[2], letter.leaves[3], letter.leaves[4]] });
                    }}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <button className="btn" disabled={!letter.to.trim() || busy} onClick={begin}>
                {busy ? "Starting…" : "Start writing"}
              </button>
            </div>
          </section>
        )}

        {/* ---------- 2. the five pages ---------- */}
        {step === 1 && (
          <section style={{ display: "grid", gap: "1.75rem" }}>
            <div role="tablist" aria-label="Pages" style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              {leafTitles.map((t, i) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={i === leafIndex}
                  onClick={() => setLeafIndex(i)}
                  style={{
                    font: "inherit",
                    background: "none",
                    border: 0,
                    padding: "0.3rem 0",
                    cursor: "pointer",
                    fontWeight: i === leafIndex ? 600 : 400,
                    color: i === leafIndex ? "var(--accent)" : "var(--ink)",
                    borderBottom: `3px solid ${i === leafIndex ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  {i + 1}. {t}
                </button>
              ))}
            </div>

            <p className="ink-muted" style={{ maxWidth: "46ch" }}>
              {leafPrompts[leafIndex]}
            </p>

            <WritingHelp
              letter={letter}
              notes={notes}
              onNotes={setNotes}
              onDrafted={(pages, question) => {
                setLetter((prev) => {
                  if (!prev) return prev;
                  const leaves = [...prev.leaves] as Experience["leaves"];
                  for (const [index, text] of Object.entries(pages)) {
                    const i = Number(index);
                    if (i >= 0 && i < 4) leaves[i] = { ...leaves[i], text };
                  }
                  return { ...prev, leaves, ...(question ? { question } : {}) };
                });
                setNotice(
                  question
                    ? "All five pages drafted, the question included. Every line is yours to change."
                    : "Drafted. Every line is yours to change.",
                );
              }}
            />

            {leafIndex < 4 && (
              <Field label="What this page says">
                <textarea
                  style={{ ...inputStyle, minHeight: "10rem", lineHeight: 1.5, resize: "vertical" }}
                  value={letter.leaves[leafIndex].text}
                  onChange={(e) => updateLeaf(leafIndex, { text: e.target.value })}
                  maxLength={1200}
                />
              </Field>
            )}

            <Field label="A photograph for this page (optional)">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void attach(file, "image");
                }}
              />
            </Field>

            {letter.leaves[leafIndex].image && (
              <div style={{ display: "grid", gap: "0.75rem", justifyItems: "start" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={letter.leaves[leafIndex].image}
                  alt="The photograph you chose for this page"
                  style={{ maxWidth: "18rem", width: "100%" }}
                />
                <Field label="Describe the photograph, for anyone who cannot see it">
                  <input
                    style={inputStyle}
                    value={letter.leaves[leafIndex].imageAlt ?? ""}
                    onChange={(e) => updateLeaf(leafIndex, { imageAlt: e.target.value })}
                  />
                </Field>
                <button
                  className="btn btn-plain"
                  onClick={() => updateLeaf(leafIndex, { image: undefined, imagePath: undefined })}
                >
                  Remove the photograph
                </button>
              </div>
            )}

            <Field label="A song for this page (optional)">
              <input
                type="file"
                accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void attach(file, "audio");
                }}
              />
            </Field>
            <p className="small ink-muted" style={{ maxWidth: "52ch" }}>
              Use your own recordings or music you have the right to share. Please do not upload
              commercial songs you do not own.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button className="btn btn-plain" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn" onClick={() => setStep(2)}>
                To the question
              </button>
            </div>
          </section>
        )}

        {/* ---------- 3. the question ---------- */}
        {step === 2 && (
          <section style={{ display: "grid", gap: "1.75rem", maxWidth: "40rem" }}>
            <Field label="What you want to ask them">
              <input
                style={inputStyle}
                value={letter.question}
                maxLength={120}
                onChange={(e) => update({ question: e.target.value })}
              />
            </Field>

            <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
              <Field label="The yes button">
                <input
                  style={inputStyle}
                  value={letter.yesLabel}
                  maxLength={24}
                  onChange={(e) => update({ yesLabel: e.target.value })}
                />
              </Field>
              <Field label="The other button">
                <input
                  style={inputStyle}
                  value={letter.noLabel}
                  maxLength={24}
                  onChange={(e) => update({ noLabel: e.target.value })}
                />
              </Field>
            </div>

            <p className="small ink-muted" style={{ maxWidth: "52ch" }}>
              The second button moves aside a few times and then works properly. It is a joke they
              are in on, not a trap.
            </p>

            <Field label="What they read if they say yes">
              <input
                style={inputStyle}
                value={letter.closing}
                maxLength={120}
                onChange={(e) => update({ closing: e.target.value })}
              />
            </Field>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button className="btn btn-plain" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn" disabled={!letter.question.trim() || busy} onClick={publish}>
                {busy ? "Saving…" : "Save and get the link"}
              </button>
            </div>
          </section>
        )}

        {/* ---------- 4. the link ---------- */}
        {step === 3 && (
          <section style={{ display: "grid", gap: "1.75rem", maxWidth: "46rem" }}>
            <p className="lead">
              It is ready. This link is the only way in, so keep a copy for yourself. It is also
              how you come back and change it.
            </p>

            <LinkBox link={link} to={letter.to} />

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link className="btn" href={`/l/${letter.id}`}>
                Read it as they will
              </Link>
              <button className="btn btn-plain" onClick={() => setStep(1)} disabled={busy}>
                Keep editing
              </button>
            </div>

            {remoteActive() ? (
              <>
                <p className="small ink-muted" style={{ maxWidth: "56ch" }}>
                  The letter is saved, so this link opens on any device you send it to. Only
                  someone holding the link can read it: it is not listed anywhere and search
                  engines are told to ignore it. The photographs and music are kept private and
                  are served through links that expire within the hour.
                </p>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    className="btn btn-plain"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        setLetter(await saveLetter(letter, false));
                        setError(null);
                        setNotice("Unpublished. The link now shows nothing until you publish it again.");
                      } catch (e) {
                        report(e);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Unpublish it
                  </button>

                  <button
                    className="btn btn-plain"
                    disabled={busy}
                    style={{ color: "var(--accent)" }}
                    onClick={async () => {
                      if (!window.confirm(`Delete this letter to ${letter.to}? The photographs and music go with it, and the link stops working. This cannot be undone.`)) {
                        return;
                      }
                      setBusy(true);
                      try {
                        await removeLetter(letter);
                        setDeleted(true);
                        setError(null);
                      } catch (e) {
                        report(e);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Delete it for good
                  </button>
                </div>
              </>
            ) : (
              <p className="small ink-muted" style={{ maxWidth: "56ch" }}>
                The database is not switched on, so this letter is kept in this browser on this
                device. Nobody else can read it, but the link will not open anywhere else, and
                clearing your browser data deletes it. Add the Supabase service-role key to
                .env.local and restart to make links work everywhere.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function LinkBox({ link, to }: { link: string; to: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      <input
        ref={ref}
        readOnly
        value={link}
        aria-label="The private link to this letter"
        onFocus={(e) => e.target.select()}
        style={{ ...inputStyle, maxWidth: "30rem" }}
      />

      <button
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
          } catch {
            ref.current?.select();
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied" : "Copy the link"}
      </button>

      {canShare && (
        <button
          className="btn btn-plain"
          onClick={async () => {
            try {
              await navigator.share({
                title: "A letter for you",
                text: `${to}, I wrote you something.`,
                url: link,
              });
            } catch {
              // The sheet was dismissed. Nothing to report.
            }
          }}
        >
          Send it
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "0.5rem" }}>
      <span className="small ink-muted">{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  font: "inherit",
  fontSize: "var(--step-body)",
  padding: "0.8rem 1rem",
  background: "var(--paper-step)",
  color: "var(--ink)",
  border: 0,
  borderRadius: "var(--radius)",
  width: "100%",
};
