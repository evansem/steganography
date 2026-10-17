"use client";

import { useEffect, useState } from "react";

const GLYPHS = "01░▒▓<>/\\{}[]#*+=~";

/**
 * Reveals text like a photo developing: characters start as noise and
 * resolve left to right. Shows the final text at once for reduced motion.
 * Render with `key={text}` so a new message restarts the animation.
 */
export function DevelopingText({ text }: { text: string }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || text.length > 2000) return;
    const chars = Array.from(text);
    const duration = Math.min(1400, 300 + chars.length * 12);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * chars.length);
      setShown(
        chars
          .map((c, i) => (i < settled || /\s/.test(c) ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="visually-hidden">{text}</span>
    </>
  );
}
