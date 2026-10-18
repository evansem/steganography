"use client";

import { useId, useState } from "react";
import styles from "./DropZone.module.css";

interface Props {
  label: string;
  hint?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}

/** Drag-and-drop or click/keyboard to pick a single image. */
export function DropZone({ label, hint = "PNG, JPG, WebP, GIF or ICO · up to 25 MB", onFile, disabled }: Props) {
  const id = useId();
  const [over, setOver] = useState(false);

  return (
    <label
      htmlFor={id}
      className={`${styles.zone} ${over ? styles.over : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        className="visually-hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 16l5-5 4 4 3-3 6 6" />
          <circle cx="16" cy="8" r="1.6" />
        </svg>
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.hint}>{hint}</span>
    </label>
  );
}
