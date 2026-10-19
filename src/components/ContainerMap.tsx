import styles from "./Explainer.module.css";

interface Field {
  label: string;
  bytes: string;
  /** Relative width in the bar. */
  grow: number;
  kind: "header" | "scattered" | "body";
}

const PLAIN: Field[] = [
  { label: "JSTG", bytes: "4", grow: 2, kind: "header" },
  { label: "ver", bytes: "1", grow: 1, kind: "header" },
  { label: "length", bytes: "4", grow: 2, kind: "header" },
  { label: "UTF-8 text", bytes: "n", grow: 9, kind: "body" },
];

const SEALED: Field[] = [
  { label: "salt", bytes: "16", grow: 3, kind: "header" },
  { label: "length", bytes: "4", grow: 2, kind: "scattered" },
  { label: "iv", bytes: "12", grow: 2, kind: "scattered" },
  { label: "ciphertext", bytes: "n", grow: 6, kind: "body" },
  { label: "tag", bytes: "16", grow: 2, kind: "scattered" },
];

function Bar({ fields, label }: { fields: Field[]; label: string }) {
  const description = fields.map((f) => `${f.label} (${f.bytes} bytes)`).join(", ");
  return (
    <div className={styles.bar} role="img" aria-label={`${label}: ${description}`}>
      {fields.map((field) => (
        <span key={field.label} className={styles.cell} data-kind={field.kind} style={{ flexGrow: field.grow }}>
          <strong>{field.label}</strong>
          <small>{field.bytes} B</small>
        </span>
      ))}
    </div>
  );
}

/** Byte layout of the two containers Justeg writes. */
export function ContainerMap() {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figTitle}>
        <span className={styles.figN}>Layout</span> What is actually written
      </figcaption>

      <div className={styles.containers}>
        <div>
          <h4 className={styles.containerTitle}>Plain · written in order from the top-left pixel</h4>
          <Bar fields={PLAIN} label="Plain container" />
          <p className={styles.figNote}>
            The magic bytes let the reader find it, and also let anyone else find it. Hidden, not secret.
          </p>
        </div>
        <div>
          <h4 className={styles.containerTitle}>Encrypted · salt in order, the rest scattered by the key</h4>
          <Bar fields={SEALED} label="Encrypted container" />
          <p className={styles.figNote}>
            No magic bytes and no fixed position: without the passphrase there is nothing fixed to search for.
          </p>
        </div>
      </div>
    </figure>
  );
}
