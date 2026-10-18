"use client";

import { useEffect, useMemo, useState } from "react";
import { bitPlane, difference, toObjectUrl } from "@/lib/image";
import type { ImageLike } from "@/lib/stego";
import styles from "./ImageStage.module.css";

type View = "image" | "bits" | "diff";

interface Props {
  original: ImageLike & { name?: string };
  /** The encoded pixels, when there are any to compare. */
  result?: Uint8ClampedArray | null;
  onClear?: () => void;
}

/**
 * Shows an image with forensic views: the raw lowest-bit plane, and a map
 * of every channel the encoder changed.
 */
export function ImageStage({ original, result, onClear }: Props) {
  const [view, setView] = useState<View>("image");
  const [url, setUrl] = useState<string | null>(null);
  const shown = result ?? original.data;
  const activeView = view === "diff" && !result ? "image" : view;

  const diff = useMemo(() => (result ? difference(original.data, result) : null), [original.data, result]);

  useEffect(() => {
    let cancelled = false;
    let made: string | null = null;
    const pixels = activeView === "bits" ? bitPlane(shown) : activeView === "diff" && diff ? diff.pixels : shown;
    toObjectUrl(pixels, original.width, original.height).then((next) => {
      if (cancelled) return URL.revokeObjectURL(next);
      made = next;
      setUrl(next);
    });
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [activeView, shown, diff, original.width, original.height]);

  const views: { id: View; label: string; disabled?: boolean }[] = [
    { id: "image", label: result ? "Encoded" : "Image" },
    { id: "bits", label: "Bit plane" },
    { id: "diff", label: "Changes", disabled: !result },
  ];

  return (
    <figure className={styles.stage}>
      <div className={styles.toolbar}>
        <div className={styles.views} role="group" aria-label="Image view">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              className={styles.view}
              aria-pressed={activeView === v.id}
              disabled={v.disabled}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        {onClear && (
          <button type="button" className={styles.clear} onClick={onClear} aria-label="Remove image">
            ×
          </button>
        )}
      </div>

      <div
        className={`${styles.frame} ${activeView !== "image" ? styles.forensic : ""} ${
          original.width < 256 ? styles.small : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing to optimise */}
        {url && <img src={url} alt={describe(activeView, original.name)} className={styles.img} />}
        <span className={styles.scan} aria-hidden="true" />
      </div>

      <figcaption className={styles.caption}>
        <span>{original.name ?? "image"}</span>
        <span>
          {original.width}×{original.height}
        </span>
        {diff && (
          <span className={styles.changed}>
            {diff.changed.toLocaleString()} channels changed (
            {((diff.changed / (original.width * original.height * 3)) * 100).toFixed(2)}%)
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function describe(view: View, name = "image") {
  if (view === "bits") return `Lowest bit plane of ${name}, amplified`;
  if (view === "diff") return `Map of channels changed in ${name}`;
  return name;
}
