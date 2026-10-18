import styles from "./Sections.module.css";
import { StatsTicker } from "./StatsTicker";

const REPO = "https://github.com/evansem/steganography";

export function Nav() {
  return (
    <header className={`container ${styles.nav}`}>
      <a href="#" className={styles.logo} aria-label="Justeg home">
        <span className={styles.logoMark} aria-hidden="true" />
        justeg
      </a>
      <nav aria-label="Main">
        <ul className={styles.navLinks}>
          <li>
            <a href="#lab">Lab</a>
          </li>
          <li>
            <a href="#how">How it works</a>
          </li>
          <li>
            <a href="#security">Security</a>
          </li>
          <li>
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className={`container ${styles.footer}`}>
      <p>
        Justeg · just a simple <strong>steg</strong>anography tool, first written in Python in 2022 and rebuilt
        for the web.
      </p>
      <StatsTicker />
      <p>
        <a href={REPO} target="_blank" rel="noreferrer">
          Source &amp; design docs ↗
        </a>
      </p>
    </footer>
  );
}
