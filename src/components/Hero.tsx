import styles from "./Hero.module.css";
import { UvInk } from "./UvInk";

export function Hero() {
  return (
    <section className={`container ${styles.hero}`}>
      <p className="eyebrow">Steganography lab · v2</p>
      <h1 className={styles.title}>
        Hide words
        <br />
        in plain <em>sight.</em>
      </h1>

      <div className={styles.copy}>
        <p className={styles.lede}>
          Justeg tucks a message into the lowest bits of an image&apos;s pixels. The picture looks the same; the words
          are there for anyone holding the right key.
        </p>
        {/* Hidden ink: only visible under the pointer's blacklight. */}
        <UvInk className={styles.secret}>
          Psst. You just did steganalysis. Move the light around: this page is full of eggs.
        </UvInk>
      </div>

      <ul className={styles.facts}>
        <li>
          <span>AES-256-GCM</span> optional encryption
        </li>
        <li>
          <span>0 bytes</span> uploaded
        </li>
        <li>
          <span>±1</span> per channel change
        </li>
      </ul>
    </section>
  );
}
