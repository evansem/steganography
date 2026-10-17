import styles from "./Sections.module.css";

const STRENGTHS = [
  ["AES-256-GCM", "Authenticated encryption. A wrong passphrase or a single flipped bit is detected, never misread."],
  ["PBKDF2 · 600k", "Passphrases are stretched with 600,000 rounds of SHA-256 and a random salt per image."],
  ["Keyed scatter", "A Feistel permutation spreads bits across the whole image, so there is no band to spot."],
  ["No signature", "Encrypted images carry no magic number. Without the key they look like any other PNG."],
  ["Nothing uploaded", "Images are decoded, edited and encoded on your device. No server ever sees them."],
];

const LIMITS = [
  "Re-saving as JPEG, resizing or posting to most social apps destroys the hidden bits. Share the PNG as a file.",
  "Statistical steganalysis can still flag that an image was edited, even if it can't read the message.",
  "Unencrypted mode is hidden, not secret: anyone with Justeg can read it.",
];

export function Security() {
  return (
    <section id="security" className={`container ${styles.section}`} aria-labelledby="security-title">
      <p className="eyebrow">Security model</p>
      <h2 id="security-title" className="section-title">
        Hidden <em>and</em> sealed.
      </h2>

      <ul className={styles.grid}>
        {STRENGTHS.map(([title, body]) => (
          <li key={title} className={styles.tile}>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ul>

      <div className={styles.limits}>
        <h3>Honest limits</h3>
        <ul>
          {LIMITS.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
