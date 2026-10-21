"use client";

import { useEffect, useRef } from "react";
import { CHANNELS, deltaE, JND, rgbCss, toBits, type Rgb } from "@/lib/colour";
import { EGG_MESSAGE, EGG_SIZE, eggIcon } from "@/lib/egg-icon";
import { bitPlane } from "@/lib/image";
import { PLAIN_HEADER_BYTES } from "@/lib/stego/plain";
import { encodeUtf8 } from "@/lib/stego/text";
import styles from "./Explainer.module.css";

const { cover, stego } = eggIcon();
const FRAME_BYTES = PLAIN_HEADER_BYTES + encodeUtf8(EGG_MESSAGE).length;
const FRAME_BITS = FRAME_BYTES * 8;
const FRAME_PIXELS = Math.ceil(FRAME_BITS / 3);
const FRAME_ROWS = FRAME_PIXELS / EGG_SIZE;

let CHANGED = 0;
for (let i = 0; i < cover.length; i++) {
  if (i % 4 !== 3 && cover[i] !== stego[i]) CHANGED++;
}

const rgbAt = (data: Uint8ClampedArray, pixel: number): Rgb => [
  data[pixel * 4]!,
  data[pixel * 4 + 1]!,
  data[pixel * 4 + 2]!,
];
const planeOf = (rgb: Rgb): Rgb => [(rgb[0] & 1) * 255, (rgb[1] & 1) * 255, (rgb[2] & 1) * 255];

/** The top-left pixel: plain background before, the first message bits after. */
const BEFORE = rgbAt(cover, 0);
const AFTER = rgbAt(stego, 0);
const DISTANCE = deltaE(BEFORE, AFTER);

const PANELS = [
  { id: "cover", label: "Favicon, before", data: cover },
  { id: "stego", label: "Favicon, after", data: stego },
  { id: "cover-bits", label: "Bit plane, before", data: bitPlane(cover) },
  { id: "stego-bits", label: "Bit plane, after", data: bitPlane(stego), band: true },
];

function Plane({ data, label }: { data: Uint8ClampedArray; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    ctx?.putImageData(new ImageData(new Uint8ClampedArray(data), EGG_SIZE, EGG_SIZE), 0, 0);
  }, [data]);

  return (
    <canvas ref={ref} width={EGG_SIZE} height={EGG_SIZE} className={styles.planeCanvas} role="img" aria-label={label} />
  );
}

/**
 * Rebuilds this site's favicon with and without its hidden message and puts
 * the two lowest-bit planes side by side.
 */
export function FaviconPlane() {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figTitle}>
        <span className={styles.figN}>Real example</span> The message hidden in this site&apos;s favicon
      </figcaption>

      <p className={styles.figLead}>
        The egg in your browser tab carries a {FRAME_BYTES}-byte plain message. These are its {EGG_SIZE}×{EGG_SIZE}{" "}
        pixels before and after Justeg wrote it, rebuilt with the same code the lab uses.
      </p>

      <div className={styles.planeLayout}>
        <div className={styles.planeGrid}>
          {PANELS.map((panel) => (
            <div key={panel.id} className={styles.planeCell}>
              <div className={styles.planeFrame}>
                <Plane data={panel.data} label={panel.label} />
                {panel.band && (
                  <span
                    className={styles.planeBand}
                    style={{ height: `${(Math.ceil(FRAME_ROWS) / EGG_SIZE) * 100}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className={styles.planeLabel}>{panel.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.flipBody}>
          <div className={styles.tableWrap}>
            <table className={styles.slots}>
              <thead>
                <tr>
                  <th scope="col">Pixel 1</th>
                  {CHANNELS.map((name) => (
                    <th key={name} scope="col">
                      {name}
                    </th>
                  ))}
                  <th scope="col">Bit plane</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Before", rgb: BEFORE },
                  { name: "After", rgb: AFTER },
                ].map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    {row.rgb.map((value, c) => (
                      <td key={c} className={styles.binary} aria-label={`${value}, lowest bit ${value & 1}`}>
                        {toBits(value).slice(0, 7)}
                        <span data-hit={row.rgb !== BEFORE && value !== BEFORE[c]}>{value & 1}</span>
                      </td>
                    ))}
                    <td>
                      <span className={styles.planeSwatch} style={{ background: rgbCss(planeOf(row.rgb)) }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.verdict}>
            rgb({BEFORE.join(", ")}) → rgb({AFTER.join(", ")}) · ΔE {DISTANCE.toFixed(2)}, below the {JND}{" "}
            just-noticeable difference. In the bit plane the same pixel jumps from magenta to green.
          </p>
        </div>
      </div>

      <h4 className={styles.planeHead}>Why the band only shows up in the bit plane</h4>
      <ul className={styles.planeReasons}>
        <li>
          <strong>The bit plane amplifies one step to the full range.</strong> It throws away the top seven bits and
          paints bit 0 as either 0 or 255. A change of 1 out of 255, invisible in the favicon, becomes the largest
          contrast the screen can show.
        </li>
        <li>
          <strong>A flat colour has uniform lowest bits.</strong> The background is rgb({BEFORE.join(", ")}) everywhere.
          Its lowest bits are {BEFORE.map((v) => v & 1).join(", ")}, so the whole plane is one solid magenta.
        </li>
        <li>
          <strong>Message bits look random.</strong> The {FRAME_BYTES} bytes become {FRAME_BITS} bits, one per channel,
          written in order from the top-left: {FRAME_PIXELS} pixels, just over {Math.floor(FRAME_ROWS)} rows. Where a
          message bit disagrees with the background&apos;s bit, the channel changes. That is {CHANGED} of {FRAME_BITS}{" "}
          channels, about half, scattered with no pattern, so the uniform magenta breaks into noise.
        </li>
        <li>
          <strong>Texture hides it, even here.</strong> Inside the egg the plane is busy before and after: the gradient
          already moves neighbouring pixels by a step or two, so its lowest bits are naturally noisy. Bits written there
          would blend in. That is why photos make better covers than flat graphics, and why a passphrase scatters the
          message across the whole image instead of leaving a band.
        </li>
      </ul>
    </figure>
  );
}
