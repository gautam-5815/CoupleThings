"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MusicPlayer from "./MusicPlayer";
import FinalQuestion from "./FinalQuestion";
import { leafTitles, type Experience } from "@/lib/experience";
import { fetchLetter, remoteEnabled } from "@/lib/letters";

type Stage = { kind: "leaf"; index: number } | { kind: "answered"; yes: boolean };

export default function LetterReader({ id }: { id: string }) {
  const [letter, setLetter] = useState<Experience | null | "missing">(null);
  const [stage, setStage] = useState<Stage>({ kind: "leaf", index: 0 });

  useEffect(() => {
    let live = true;
    fetchLetter(id)
      .then((found) => live && setLetter(found ?? "missing"))
      .catch(() => live && setLetter("missing"));
    return () => {
      live = false;
    };
  }, [id]);

  if (letter === null) {
    return <Shell><p>Opening the letter…</p></Shell>;
  }

  if (letter === "missing") {
    return (
      <Shell>
        <div style={{ display: "grid", gap: "1.5rem", maxWidth: "46ch" }}>
          <h1 className="head">
            {remoteEnabled ? "There is no letter here." : "This letter is not on this device."}
          </h1>
          <p>
            {remoteEnabled
              ? "The link may be mistyped, or whoever sent it has taken the letter down. Ask them for it again."
              : "No database is configured, so letters stay in the browser they were written in. Ask whoever sent it to open it where they wrote it."}
          </p>
          <Link className="btn" href="/">
            Write one yourself
          </Link>
        </div>
      </Shell>
    );
  }

  if (stage.kind === "answered") {
    return (
      <Shell>
        <div style={{ display: "grid", gap: "2rem", justifyItems: "center", textAlign: "center" }}>
          <h1 className="head" style={{ maxWidth: "20ch" }}>
            {stage.yes ? letter.closing : "That is a fair answer."}
          </h1>
          <p style={{ maxWidth: "44ch" }}>
            {stage.yes
              ? `${letter.from || "They"} will see that you read all five pages.`
              : "Nothing is pretending otherwise. You can close this, or read it again."}
          </p>

          {stage.yes && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
                gap: "0.75rem",
                width: "min(100%, 40rem)",
              }}
            >
              {letter.leaves
                .filter((l) => l.image)
                .map((l, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={l.image}
                    alt={l.imageAlt ?? "A photograph from the letter"}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                  />
                ))}
            </div>
          )}

          <button className="btn btn-plain" onClick={() => setStage({ kind: "leaf", index: 0 })}>
            Read it again
          </button>
        </div>
      </Shell>
    );
  }

  const index = stage.index;
  const leaf = letter.leaves[index];
  const isLast = index === 4;

  return (
    <Shell>
      <article
        className="sheet"
        style={{
          width: "min(100%, 54rem)",
          background: "var(--paper)",
          padding: "clamp(1.5rem, 4vw, 3.5rem)",
          display: "grid",
          gap: "clamp(1.25rem, 3vw, 2rem)",
        }}
      >
        {/* progress, said in words rather than drawn as dots */}
        <p className="small ink-muted">
          {leafTitles[index]}, page {index + 1} of 5
        </p>

        {index === 0 && (
          <p className="hand" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "var(--accent)", lineHeight: 1.1 }}>
            For {letter.to}
          </p>
        )}

        {leaf.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={leaf.image}
            alt={leaf.imageAlt ?? "A photograph chosen for this page"}
            style={{ width: "100%", maxHeight: "48svh", objectFit: "cover" }}
          />
        )}

        {isLast ? (
          <FinalQuestion
            question={letter.question}
            yesLabel={letter.yesLabel}
            noLabel={letter.noLabel}
            onYes={() => setStage({ kind: "answered", yes: true })}
            onNo={() => setStage({ kind: "answered", yes: false })}
          />
        ) : (
          <p style={{ fontSize: "var(--step-lead)", lineHeight: 1.5, whiteSpace: "pre-line" }}>
            {leaf.text}
          </p>
        )}

        <MusicPlayer src={leaf.audio} title={leaf.audioTitle} />

        <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", flexWrap: "wrap" }}>
          <button
            className="btn btn-plain"
            onClick={() => setStage({ kind: "leaf", index: Math.max(0, index - 1) })}
            disabled={index === 0}
          >
            Back
          </button>
          {!isLast && (
            <button className="btn" onClick={() => setStage({ kind: "leaf", index: index + 1 })}>
              Next
            </button>
          )}
        </div>

        <p style={{ fontWeight: 500 }}>
          {index === 4 ? `— ${letter.from}` : ""}
        </p>
      </article>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100svh",
        background: "var(--field-rose)",
        color: "var(--ink)",
        display: "grid",
        placeItems: "center",
        padding: "var(--margin)",
      }}
    >
      {children}
    </main>
  );
}
