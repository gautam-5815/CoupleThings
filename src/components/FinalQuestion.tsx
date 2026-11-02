"use client";

import { useRef, useState } from "react";

/**
 * The last page. "Yes" never moves and is always easy to hit.
 *
 * The other button shies away a few times — on hover with a mouse, on the
 * first tap on a touch screen — and then it settles down and works. It
 * stays inside its own box, it keeps its place in the keyboard order, and
 * it never moves for someone who asked for reduced motion or who is
 * driving it from the keyboard. An honest "not yet" has to be sayable.
 */
const DODGES = 3;

export default function FinalQuestion({
  question,
  yesLabel,
  noLabel,
  onYes,
  onNo,
}: {
  question: string;
  yesLabel: string;
  noLabel: string;
  onYes: () => void;
  onNo: () => void;
}) {
  const arena = useRef<HTMLDivElement | null>(null);
  const [dodges, setDodges] = useState(0);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const settled = dodges >= DODGES;

  function dodge() {
    if (settled) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDodges(DODGES);
      return;
    }
    const box = arena.current?.getBoundingClientRect();
    if (!box) return;

    // Stay inside the arena, with room for the button itself.
    const reach = { x: Math.max(0, box.width / 2 - 90), y: Math.max(0, box.height / 2 - 34) };
    const x = (Math.random() * 2 - 1) * reach.x;
    const y = (Math.random() * 2 - 1) * reach.y;

    setOffset({ x, y });
    setDodges((d) => d + 1);
  }

  return (
    <div style={{ display: "grid", gap: "2.5rem", justifyItems: "center", textAlign: "center" }}>
      <h2 className="head" style={{ maxWidth: "20ch" }}>
        {question}
      </h2>

      <div
        ref={arena}
        style={{
          position: "relative",
          width: "min(100%, 34rem)",
          minHeight: "11rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <button type="button" className="btn" onClick={onYes} style={{ fontSize: "var(--step-lead)" }}>
          {yesLabel}
        </button>

        <button
          type="button"
          onClick={() => (settled ? onNo() : dodge())}
          onMouseEnter={dodge}
          onTouchStart={(e) => {
            if (!settled) {
              e.preventDefault();
              dodge();
            }
          }}
          aria-describedby={settled ? undefined : "no-hint"}
          style={{
            font: "inherit",
            fontSize: "var(--step-lead)",
            fontWeight: 500,
            background: "var(--paper-step)",
            color: "var(--ink)",
            border: 0,
            borderRadius: "var(--radius)",
            padding: "0.95rem 1.6rem",
            cursor: "pointer",
            position: offset ? "absolute" : "relative",
            left: offset ? "50%" : undefined,
            top: offset ? "50%" : undefined,
            transform: offset
              ? `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
              : undefined,
            transition: "transform 0.28s cubic-bezier(0.2, 0.7, 0.3, 1)",
          }}
        >
          {noLabel}
        </button>
      </div>

      <p id="no-hint" className="small ink-muted" style={{ maxWidth: "40ch" }}>
        {settled
          ? "Both answers work. Choose the true one."
          : "One of these is being shy. It will stop in a moment."}
      </p>
    </div>
  );
}
