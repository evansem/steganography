"use client";

import { useEffect, useRef } from "react";
import styles from "./UvInk.module.css";

/**
 * Text written in "invisible ink": it only shows inside the blacklight
 * circle around the pointer. Tracks the pointer relative to itself so the
 * mask lines up wherever the element sits on the page.
 */
export function UvInk({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--lx", `${event.clientX - rect.left}px`);
        node.style.setProperty("--ly", `${event.clientY - rect.top}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <p ref={ref} className={`${styles.ink} ${className}`} aria-hidden="true">
      {children}
    </p>
  );
}
