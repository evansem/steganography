"use client";

import { useEffect } from "react";
import styles from "./Blacklight.module.css";

/**
 * A UV lamp that follows the pointer. It writes the pointer position to CSS
 * variables, which the glow layer and any `.uv-ink` text use as a mask.
 */
export function Blacklight() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--mx", `${event.clientX}px`);
        root.style.setProperty("--my", `${event.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.lamp} />
      <div className={styles.grain} />
    </div>
  );
}
