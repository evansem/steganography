"use client";

import { useState, type ReactNode } from "react";
import { FaviconPanel } from "./FaviconPanel";
import { HidePanel } from "./HidePanel";
import { RevealPanel } from "./RevealPanel";
import styles from "./Workbench.module.css";

interface Tab {
  id: string;
  label: string;
  blurb: string;
  render: () => ReactNode;
}

const TABS: Tab[] = [
  { id: "hide", label: "Hide", blurb: "Write a message into an image", render: () => <HidePanel /> },
  { id: "reveal", label: "Reveal", blurb: "Recover a message from an image", render: () => <RevealPanel /> },
  { id: "favicon", label: "Favicon", blurb: "Read any website's icon", render: () => <FaviconPanel /> },
];

export function Workbench() {
  const [active, setActive] = useState(TABS[0]!.id);

  return (
    <section id="lab" className={`container ${styles.section}`} aria-labelledby="lab-title">
      <div className={styles.head}>
        <div>
          <p className="eyebrow">The lab</p>
          <h2 id="lab-title" className="section-title">
            Pick an image. <em>Leave a trace.</em>
          </h2>
        </div>
        <p className={styles.local}>
          <span className={styles.dot} aria-hidden="true" /> Runs entirely in your browser
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs} role="tablist" aria-label="Mode">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active === tab.id ? 0 : -1}
              className={styles.tab}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                const index = TABS.findIndex((t) => t.id === active);
                const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!;
                setActive(next.id);
                document.getElementById(`tab-${next.id}`)?.focus();
              }}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.tabBlurb}>{tab.blurb}</span>
            </button>
          ))}
        </div>

        {TABS.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={active !== tab.id}
            className={styles.panel}
          >
            {tab.render()}
          </div>
        ))}
      </div>
    </section>
  );
}
