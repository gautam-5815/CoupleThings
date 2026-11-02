"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The live thing. You type the one name this letter is for, and the
 * envelope addresses itself in handwriting and takes its seal. The name
 * is carried straight into the first field of the real creation flow.
 *
 * Without JavaScript the form still posts to /create, so the page works.
 */
export default function EnvelopeAddress() {
  const router = useRouter();
  const [name, setName] = useState("");
  const trimmed = name.trim().slice(0, 24);
  const addressed = trimmed.length > 0;

  return (
    <form
      action="/create"
      method="get"
      onSubmit={(e) => {
        if (!addressed) return;
        e.preventDefault();
        router.push(`/create?for=${encodeURIComponent(trimmed)}`);
      }}
      style={{ display: "grid", gap: "1.5rem" }}
    >
      {/* The address block, written as the envelope would carry it */}
      <div
        aria-live="polite"
        style={{
          minHeight: "4.5rem",
          display: "flex",
          alignItems: "baseline",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span className="hand" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", lineHeight: 1.1 }}>
          For
        </span>
        <span
          className="hand"
          style={{
            fontSize: "clamp(2rem, 5.2vw, 3.4rem)",
            lineHeight: 1.1,
            color: addressed ? "var(--accent)" : "var(--muted)",
            borderBottom: "2px solid currentColor",
            minWidth: "7ch",
            paddingInline: "0.2em",
            transition: "color 0.2s ease",
          }}
        >
          {addressed ? trimmed : " "}
        </span>
      </div>

      <label style={{ display: "grid", gap: "0.5rem" }}>
        <span className="small ink-muted">Who is this letter for?</span>
        <input
          name="for"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="off"
          placeholder="Their name, or what you call them"
          style={{
            font: "inherit",
            fontSize: "var(--step-body)",
            padding: "0.85rem 1rem",
            background: "var(--paper-step)",
            color: "var(--ink)",
            border: "0",
            borderRadius: "var(--radius)",
            width: "100%",
          }}
        />
      </label>

      <button className="btn" type="submit" disabled={!addressed}>
        {addressed ? `Write ${trimmed}’s letter` : "Write their letter"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
