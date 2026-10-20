"use client";

import { usePointerMove } from "@/hooks/usePointerMove";
import styles from "./Blacklight.module.css";

/**
 * A UV lamp that follows the pointer. It writes the pointer position to CSS
 * variables, which the glow layer and any `.uv-ink` text use as a mask.
 */
export function Blacklight() {
  usePointerMove((event) => {
    const root = document.documentElement;
    root.style.setProperty("--mx", `${event.clientX}px`);
    root.style.setProperty("--my", `${event.clientY}px`);
  });

  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.lamp} />
      <div className={styles.grain} />
    </div>
  );
}
