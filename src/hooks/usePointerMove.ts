"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onMove` with the latest pointer event at most once per animation
 * frame, for as long as the component is mounted.
 */
export function usePointerMove(onMove: (event: PointerEvent) => void): void {
  const handler = useRef(onMove);

  useEffect(() => {
    handler.current = onMove;
  });

  useEffect(() => {
    let frame = 0;
    const listener = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => handler.current(event));
    };
    window.addEventListener("pointermove", listener, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", listener);
    };
  }, []);
}
