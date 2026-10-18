"use client";

import { useEffect, useState } from "react";
import styles from "./Sections.module.css";

type Totals = { hide: number; reveal: number; favicon: number };

/** Anonymous running totals from /api/stats. Renders nothing if unavailable. */
export function StatsTicker() {
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { totals?: Totals } | null) => {
        if (data?.totals) setTotals(data.totals);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!totals || totals.hide + totals.reveal + totals.favicon === 0) return null;
  const n = (value: number) => value.toLocaleString("en");
  return (
    <p className={styles.ticker} aria-label="Usage so far">
      <span>{n(totals.hide)}</span> hidden · <span>{n(totals.reveal)}</span> revealed · <span>{n(totals.favicon)}</span>{" "}
      icons read
    </p>
  );
}
