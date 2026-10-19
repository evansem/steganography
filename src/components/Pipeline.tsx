import styles from "./Explainer.module.css";

interface Stage {
  title: string;
  body: string;
  /** Only runs when a passphrase is set. */
  sealed?: boolean;
}

const HIDE: Stage[] = [
  { title: "Text", body: "Any Unicode, encoded as UTF-8 bytes." },
  { title: "Derive keys", body: "PBKDF2-SHA256, 600k rounds, random 16-byte salt.", sealed: true },
  { title: "Encrypt", body: "AES-256-GCM seals the bytes and adds a tamper tag.", sealed: true },
  { title: "Frame", body: "A header records the length so the reader knows where to stop." },
  { title: "Order", body: "Sequential from the first pixel, or a keyed Feistel scatter." },
  { title: "Write LSBs", body: "1 or 2 bits replace the lowest bits of each R, G and B." },
  { title: "Save losslessly", body: "PNG, or PPM for Netpbm covers. JPEG would wipe the bits." },
];

/** The hide pipeline, stage by stage. Reveal runs the same stages backwards. */
export function Pipeline() {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figTitle}>
        <span className={styles.figN}>Pipeline</span> From message to image
      </figcaption>

      <ol className={styles.pipeline}>
        {HIDE.map((stage, i) => (
          <li key={stage.title} className={styles.stage} data-sealed={stage.sealed ?? false}>
            <span className={styles.stageN}>{String(i + 1).padStart(2, "0")}</span>
            <strong>{stage.title}</strong>
            <span>{stage.body}</span>
          </li>
        ))}
      </ol>

      <p className={styles.legend}>
        <span className={styles.legendKey} data-sealed="true" aria-hidden="true" /> runs only with a passphrase.
        Revealing reads the same slots in the same order and runs every step in reverse. With encryption, a wrong
        passphrase picks the wrong slots and fails the tag check, so it finds nothing rather than garbage.
      </p>
    </figure>
  );
}
