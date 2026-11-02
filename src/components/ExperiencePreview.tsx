"use client";

import Image from "next/image";
import { useState } from "react";
import { pictures } from "@/lib/credits";

/**
 * A real fragment of the five-page experience, built in HTML at the size
 * it is read, so the showcase shows the product rather than a mock-up.
 * The letter below is sample content, listed in the report to be swapped.
 */
const leaves = [
  {
    label: "One",
    name: "The opening",
    render: () => (
      <div style={{ display: "grid", alignContent: "space-between", gap: "1rem", height: "100%", textAlign: "center" }}>
        <p className="hand" style={{ fontSize: "clamp(1.8rem, 4.4vw, 2.8rem)", lineHeight: 1.15, color: "var(--accent)" }}>
          For Priya
        </p>
        <p style={{ fontSize: "clamp(1.15rem, 2.4vw, 1.5rem)", maxWidth: "24ch", marginInline: "auto" }}>
          There is something I have wanted to say all week, so I wrote it down instead.
        </p>
        <div style={{ display: "grid", gap: "0.9rem", justifyItems: "center" }}>
          <span className="seal" aria-hidden="true">
            CT
          </span>
          <span className="small ink-muted">Turn the page</span>
        </div>
      </div>
    ),
  },
  {
    label: "Two",
    name: "The memory",
    render: () => (
      <figure style={{ margin: 0, display: "grid", gap: "0.75rem", height: "100%", gridTemplateRows: "1fr auto" }}>
        <div style={{ position: "relative", overflow: "hidden", background: "var(--paper-step)" }}>
          <Image
            src={pictures.toMyDearValentine.src}
            alt={pictures.toMyDearValentine.alt}
            fill
            sizes="(max-width: 768px) 90vw, 36vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <figcaption className="small">
          The first thing you ever gave me, which I still have in the drawer by the bed.
        </figcaption>
      </figure>
    ),
  },
  {
    label: "Three",
    name: "The letter",
    render: () => (
      <div style={{ display: "grid", alignContent: "space-between", gap: "1.25rem", height: "100%" }}>
        <p style={{ fontSize: "clamp(1.15rem, 2.3vw, 1.45rem)", lineHeight: 1.5 }}>
          I was short with you on Tuesday and I knew it the moment I said it. You went quiet and
          I let you, and then I spent the whole evening rehearsing what I should have said.
        </p>
        <p style={{ fontSize: "clamp(1.15rem, 2.3vw, 1.45rem)", lineHeight: 1.5 }}>
          You are not difficult to live with. I was just tired and you were the nearest person.
        </p>
        <p className="small ink-muted">Page three of five</p>
      </div>
    ),
  },
  {
    label: "Four",
    name: "The promise",
    render: () => (
      <div style={{ display: "grid", alignContent: "space-between", gap: "1.25rem", height: "100%" }}>
        <p className="hand" style={{ fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)", lineHeight: 1.2 }}>
          I will tell you when I am tired instead of taking it out on you.
        </p>
        <p style={{ fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.5 }}>
          And on Sunday I am making the pancakes, the slow way, the way you like them.
        </p>
        <p className="small ink-muted">Written by you, not by us</p>
      </div>
    ),
  },
  {
    label: "Five",
    name: "The question",
    render: () => (
      <div style={{ display: "grid", alignContent: "center", gap: "1.5rem", height: "100%", textAlign: "center" }}>
        <p style={{ fontSize: "clamp(1.2rem, 2.6vw, 1.6rem)", lineHeight: 1.3 }}>
          Will you let me make you breakfast on Sunday?
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <span style={{ background: "var(--accent)", color: "var(--accent-ink)", padding: "0.7rem 1.6rem" }}>
            Yes
          </span>
          <span style={{ background: "var(--paper-step)", color: "var(--muted)", padding: "0.7rem 1.6rem" }}>
            Not yet
          </span>
        </div>
      </div>
    ),
  },
];

export default function ExperiencePreview() {
  const [active, setActive] = useState(0);
  const leaf = leaves[active];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div
        role="tablist"
        aria-label="The five pages"
        style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "baseline" }}
      >
        {leaves.map((l, i) => (
          <button
            key={l.label}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            style={{
              font: "inherit",
              fontSize: "var(--step-body)",
              fontWeight: i === active ? 600 : 400,
              color: i === active ? "var(--accent)" : "var(--ink)",
              background: "none",
              border: 0,
              padding: "0.25rem 0",
              cursor: "pointer",
              borderBottom: i === active ? "3px solid var(--accent)" : "3px solid transparent",
            }}
          >
            {l.label}
          </button>
        ))}
        <span className="small ink-muted" style={{ marginLeft: "auto" }}>
          {leaf.name}
        </span>
      </div>

      {/* The leaf itself, at the proportions of a sheet of paper */}
      <div
        data-ui=""
        className="sheet"
        style={{
          aspectRatio: "4 / 5",
          padding: "clamp(1.25rem, 3vw, 2.25rem)",
          background: "var(--paper)",
          overflow: "hidden",
        }}
      >
        {leaf.render()}
      </div>
    </div>
  );
}
