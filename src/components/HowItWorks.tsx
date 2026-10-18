import styles from "./Sections.module.css";

const BYTE = ["1", "0", "1", "1", "0", "1", "1", "0"];

const STEPS = [
  {
    n: "01",
    title: "Every pixel is three numbers",
    body: "Red, green and blue, each stored as 8 bits from 0 to 255. Your eye can't tell 182 from 183.",
  },
  {
    n: "02",
    title: "The last bit is spare",
    body: "Justeg overwrites the lowest one or two bits of each channel with bits of your message. Colours shift by at most ±1 or ±3.",
  },
  {
    n: "03",
    title: "A key decides where",
    body: "With a passphrase, the message is encrypted first and then scattered across the image in an order only the key can reproduce.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className={`container ${styles.section}`} aria-labelledby="how-title">
      <p className="eyebrow">How it works</p>
      <h2 id="how-title" className="section-title">
        The secret lives in the <em>least significant</em> bit.
      </h2>

      <div className={styles.byte} aria-label="One colour channel: bits 1011011 followed by the hidden bit">
        {BYTE.map((bit, i) => (
          <span key={i} className={i === BYTE.length - 1 ? styles.hiddenBit : styles.bit} aria-hidden="true">
            {bit}
          </span>
        ))}
        <span className={styles.byteNote} aria-hidden="true">
          ← this one carries your message
        </span>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li key={step.n} className={styles.step}>
            <span className={styles.stepN}>{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
