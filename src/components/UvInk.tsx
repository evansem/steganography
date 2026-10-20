"use client";

import { useRef, type ReactNode } from "react";
import { usePointerMove } from "@/hooks/usePointerMove";
import styles from "./UvInk.module.css";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Text written in "invisible ink": it only shows inside the blacklight
 * circle around the pointer. Tracks the pointer relative to itself so the
 * mask lines up wherever the element sits on the page.
 */
export function UvInk({ children, className = "" }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);

  usePointerMove((event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--lx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--ly", `${event.clientY - rect.top}px`);
  });

  return (
    <p ref={ref} className={`${styles.ink} ${className}`} aria-hidden="true">
      {children}
    </p>
  );
}
