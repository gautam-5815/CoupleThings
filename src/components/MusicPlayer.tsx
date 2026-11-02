"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One audio element for the whole visit, so a track keeps playing as the
 * reader turns pages. It starts silent: browsers refuse autoplay without
 * a gesture, and a letter that blares music the moment it opens is worse
 * than one that waits to be asked.
 */
export default function MusicPlayer({
  src,
  title,
}: {
  src?: string;
  title?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [blocked, setBlocked] = useState(false);

  // A new page's track replaces the old one, keeping the play state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.volume = volume;
    audio.muted = muted;
    if (playing) {
      audio.play().catch(() => setBlocked(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  if (!src) return null;

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
        setBlocked(false);
      } catch {
        setBlocked(true);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.9rem",
        flexWrap: "wrap",
        background: "var(--paper-step)",
        padding: "0.6rem 0.9rem",
      }}
    >
      <audio ref={audioRef} src={src} loop onEnded={() => setPlaying(false)} preload="none" />

      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        style={{
          font: "inherit",
          fontSize: "var(--step-small)",
          fontWeight: 500,
          background: "var(--ink)",
          color: "var(--paper)",
          border: 0,
          padding: "0.45rem 0.9rem",
          cursor: "pointer",
        }}
      >
        {playing ? "Pause" : "Play"}
      </button>

      <span className="small" style={{ minWidth: "6ch" }}>
        {title ?? "Music"}
      </span>

      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-pressed={muted}
        style={{
          font: "inherit",
          fontSize: "var(--step-small)",
          background: "transparent",
          border: 0,
          padding: "0.45rem 0.3rem",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: "0.3em",
        }}
      >
        {muted ? "Unmute" : "Mute"}
      </button>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="small ink-muted">Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: "7rem" }}
        />
      </label>

      {blocked && (
        <span className="small ink-muted" role="status">
          Your browser blocked the sound. Press play again.
        </span>
      )}
    </div>
  );
}
