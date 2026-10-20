import { CHANNELS, deltaE, JND, rgbCss, toBits, type Rgb } from "@/lib/colour";
import styles from "./Explainer.module.css";

/** Three neighbouring sky-blue pixels, the kind a photo is full of. */
const PIXELS: Rgb[] = [
  [118, 164, 212],
  [121, 166, 213],
  [119, 163, 210],
];
const LETTER = "J";
const CODE = LETTER.charCodeAt(0);
const MESSAGE_BITS = [...toBits(CODE)].map(Number);

interface Slot {
  pixel: number;
  channel: (typeof CHANNELS)[number];
  before: number;
  after: number;
  carried: number | null;
}

// Write the 8 bits of "J" into the lowest bit of the first 8 channels, in order.
const SLOTS: Slot[] = PIXELS.flatMap((rgb, pixel) =>
  rgb.map((before, c) => {
    const index = pixel * 3 + c;
    const carried = MESSAGE_BITS[index] ?? null;
    return {
      pixel,
      channel: CHANNELS[c]!,
      before,
      after: carried === null ? before : (before & ~1) | carried,
      carried,
    };
  }),
);
const AFTER: Rgb[] = PIXELS.map((_, p) => {
  const [r, g, b] = SLOTS.slice(p * 3, p * 3 + 3).map((slot) => slot.after);
  return [r!, g!, b!];
});
const WORST = Math.max(...PIXELS.map((rgb, p) => deltaE(rgb, AFTER[p]!)));

/** Walks through hiding one letter in three pixels, bit by bit. */
export function PixelZoom() {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figTitle}>
        <span className={styles.figN}>Zoom in</span> Hiding the letter “{LETTER}” in three pixels
      </figcaption>

      <p className={styles.figLead}>
        “{LETTER}” is byte {CODE}, or <code>{MESSAGE_BITS.join("")}</code> in binary. Each bit replaces the lowest bit
        of one colour channel, so it takes eight channels: just under three pixels.
      </p>

      <div className={styles.zoom}>
        <div className={styles.zoomStrip} aria-hidden="true">
          <span className={styles.zoomLabel}>before</span>
          {PIXELS.map((rgb, p) => (
            <span key={p} className={styles.zoomPixel} style={{ background: rgbCss(rgb) }} />
          ))}
          <span className={styles.zoomLabel}>after</span>
          {AFTER.map((rgb, p) => (
            <span key={p} className={styles.zoomPixel} style={{ background: rgbCss(rgb) }} />
          ))}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.slots}>
            <thead>
              <tr>
                <th scope="col">Pixel</th>
                <th scope="col">Channel</th>
                <th scope="col">Before</th>
                <th scope="col">Message bit</th>
                <th scope="col">After</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={`${slot.pixel}${slot.channel}`} data-idle={slot.carried === null}>
                  <td>{slot.pixel + 1}</td>
                  <td>{slot.channel}</td>
                  <td className={styles.binary}>
                    {toBits(slot.before).slice(0, 7)}
                    <span data-hit="false">{slot.before & 1}</span>
                  </td>
                  <td>{slot.carried ?? "–"}</td>
                  <td className={styles.binary}>
                    {toBits(slot.after).slice(0, 7)}
                    <span data-hit={slot.carried !== null}>{slot.after & 1}</span>
                  </td>
                  <td>{slot.after === slot.before ? "0" : slot.after > slot.before ? "+1" : "−1"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className={styles.figNote}>
        Roughly half the bits already match, so only {SLOTS.filter((s) => s.after !== s.before).length} of{" "}
        {MESSAGE_BITS.length} channels change, each by one step out of 256. The largest colour difference is ΔE{" "}
        {WORST.toFixed(2)}, {Math.round((WORST / JND) * 100)}% of the smallest difference the eye can notice.
      </p>
    </figure>
  );
}
