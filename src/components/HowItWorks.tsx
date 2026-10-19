import { BitFlip } from "./BitFlip";
import { ContainerMap } from "./ContainerMap";
import explainer from "./Explainer.module.css";
import { Pipeline } from "./Pipeline";
import { PixelZoom } from "./PixelZoom";
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

      <div className={explainer.figures}>
        <h3 className={explainer.subhead}>Why nobody notices</h3>
        <p className={explainer.intro}>
          A channel&apos;s bits are not equal. The top bit is worth 128 steps of brightness, the bottom bit just one.
          Changing the bottom bit moves the colour by less than 0.4%, well under the smallest difference human vision
          can pick out, measured below as ΔE in the CIELAB colour space.
        </p>
        <BitFlip />
        <PixelZoom />

        <h3 className={explainer.subhead}>What happens when you press Hide</h3>
        <Pipeline />
        <ContainerMap />
        <p className={explainer.intro}>
          The change is invisible, not undetectable. Open the <a href="#lab">lab</a>, load an image and switch to{" "}
          <strong>Bit plane</strong>: a plain message shows up as a band of noise along the top, while an encrypted one
          is spread across the whole picture.
        </p>
      </div>
    </section>
  );
}
