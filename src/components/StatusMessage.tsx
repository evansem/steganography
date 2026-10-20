import styles from "./Controls.module.css";

export interface Status {
  tone: "idle" | "error" | "success";
  text: string;
}

export const IDLE: Status = { tone: "idle", text: "" };

/** Live region that announces progress and results to screen readers. */
export function StatusMessage({ status }: { status: Status }) {
  return (
    <p className={styles.status} data-tone={status.tone} role="status" aria-live="polite">
      {status.text}
    </p>
  );
}
