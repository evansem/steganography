"use client";

import { useState } from "react";
import { deltaE, flipBit, JND, type Rgb } from "@/lib/colour";
import styles from "./Explainer.module.css";

const BASE: Rgb = [182, 104, 214];
const CHANNELS = ["R", "G", "B"] as const;

const css = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;
const bits = (value: number) => value.toString(2).padStart(8, "0").split("");

/**
 * Lets the reader flip any one bit of a colour and see, and measure, how much
 * it changes. Only the lowest bits stay below the just-noticeable difference.
 */
export function BitFlip() {
  const [bit, setBit] = useState(0);
  const flipped = flipBit(BASE, bit);
  const distance = deltaE(BASE, flipped);
  const visible = distance >= JND;

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figTitle}>
        <span className={styles.figN}>Try it</span> Flip one bit of every channel
      </figcaption>

      <div className={styles.flipGrid}>
        <div className={styles.swatches}>
          <div className={styles.swatch} style={{ background: css(BASE) }}>
            <span>original</span>
          </div>
          <div className={styles.swatch} style={{ background: css(flipped) }}>
            <span>bit {bit} flipped</span>
          </div>
        </div>

        <div className={styles.flipBody}>
          <div className={styles.bitPicker} role="radiogroup" aria-label="Bit to flip">
            {Array.from({ length: 8 }, (_, i) => 7 - i).map((position) => (
              <button
                key={position}
                type="button"
                role="radio"
                aria-checked={bit === position}
                aria-label={`Bit ${position}, worth ${2 ** position}`}
                className={styles.bitChoice}
                data-lsb={position === 0}
                onClick={() => setBit(position)}
              >
                <span>{2 ** position}</span>
              </button>
            ))}
          </div>

          <table className={styles.channels}>
            <tbody>
              {CHANNELS.map((name, c) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td className={styles.binary} aria-label={`${BASE[c]} becomes ${flipped[c]}`}>
                    {bits(flipped[c]!).map((value, i) => (
                      <span key={i} data-hit={7 - i === bit}>
                        {value}
                      </span>
                    ))}
                  </td>
                  <td>
                    {BASE[c]} → {flipped[c]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className={styles.verdict} data-visible={visible} aria-live="polite">
            ΔE {distance.toFixed(2)} ·{" "}
            {visible
              ? "a difference you can see."
              : `below the ${JND} just-noticeable difference. Your eye can't tell them apart.`}
          </p>
        </div>
      </div>
    </figure>
  );
}
