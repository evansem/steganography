"use client";

import { useMemo, useState } from "react";
import { decodeImage, encodeNetpbm, encodePng, type LoadedImage } from "@/lib/image";
import { formatBytes, friendlyError } from "@/lib/messages";
import { hide, plainCapacity, sealedCapacity, type BitDepth } from "@/lib/stego";
import styles from "./Controls.module.css";
import { DropZone } from "./DropZone";
import { ImageStage } from "./ImageStage";

type Status = { tone: "idle" | "error" | "success"; text: string };

interface Inputs {
  image: LoadedImage | null;
  text: string;
  encrypt: boolean;
  passphrase: string;
  depth: BitDepth;
}

interface Output {
  inputs: Inputs;
  pixels: Uint8ClampedArray;
  url: string;
  size: number;
  /** Netpbm copy, offered when the cover image was Netpbm. */
  netpbm?: { url: string; size: number };
}

const sameInputs = (a: Inputs, b: Inputs) =>
  a.image === b.image &&
  a.text === b.text &&
  a.encrypt === b.encrypt &&
  a.depth === b.depth &&
  (!a.encrypt || a.passphrase === b.passphrase);

export function HidePanel() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [text, setText] = useState("");
  const [encrypt, setEncrypt] = useState(true);
  const [passphrase, setPassphrase] = useState("");
  const [depth, setDepth] = useState<BitDepth>(1);
  const [output, setOutput] = useState<Output | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ tone: "idle", text: "" });

  const used = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const available = image ? (encrypt ? sealedCapacity(image, depth) : plainCapacity(image, depth)) : 0;
  const over = image !== null && used > available;
  const needsPassphrase = encrypt && passphrase.length === 0;

  // A result only counts while the inputs that produced it are unchanged.
  const inputs: Inputs = { image, text, encrypt, passphrase, depth };
  const result = output && sameInputs(output.inputs, inputs) ? output : null;

  async function load(file: File) {
    setStatus({ tone: "idle", text: "Reading image…" });
    try {
      setImage(await decodeImage(file, file.name));
      setStatus({ tone: "idle", text: "" });
    } catch (error) {
      setStatus({ tone: "error", text: friendlyError(error) });
    }
  }

  async function run() {
    if (!image) return;
    setBusy(true);
    setStatus({ tone: "idle", text: encrypt ? "Deriving key and encrypting…" : "Writing bits…" });
    try {
      const pixels = await hide(image, text, { passphrase: encrypt ? passphrase : undefined, depth });
      const blob = await encodePng(pixels, image.width, image.height);
      const pnm = image.format === "netpbm" ? encodeNetpbm(pixels, image.width, image.height) : null;
      if (output) {
        URL.revokeObjectURL(output.url);
        if (output.netpbm) URL.revokeObjectURL(output.netpbm.url);
      }
      setOutput({
        inputs,
        pixels,
        url: URL.createObjectURL(blob),
        size: blob.size,
        netpbm: pnm ? { url: URL.createObjectURL(pnm), size: pnm.size } : undefined,
      });
      setStatus({
        tone: "success",
        text: `Done. The message is inside. Download the ${pnm ? "PNG or Netpbm file" : "PNG"} below.`,
      });
    } catch (error) {
      setStatus({ tone: "error", text: friendlyError(error) });
    } finally {
      setBusy(false);
    }
  }

  const baseName = (image?.name ?? "image").replace(/\.[^.]+$/, "");
  const downloadName = `${baseName}-justeg.png`;
  // keep the source's own Netpbm extension, as the 2022 prototype did
  const netpbmExtension = /\.(pbm|pgm|ppm|pnm)$/i.exec(image?.name ?? "")?.[0].toLowerCase() ?? ".ppm";
  const netpbmName = `${baseName}-justeg${netpbmExtension}`;

  return (
    <div className={styles.panel}>
      <div>
        {image ? (
          <ImageStage original={image} result={result?.pixels} onClear={() => setImage(null)} />
        ) : (
          <DropZone label="Drop a cover image" onFile={load} />
        )}
      </div>

      <form
        className={styles.controls}
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="hide-message" className={styles.label}>
              Secret message
            </label>
            <span className={styles.count} data-over={over}>
              {formatBytes(used)} / {image ? formatBytes(available) : "–"}
            </span>
          </div>
          <textarea
            id="hide-message"
            className={styles.textarea}
            placeholder="Write something only the right person should read…"
            value={text}
            aria-invalid={over}
            aria-describedby="hide-capacity"
            onChange={(event) => setText(event.target.value)}
          />
          <div className={`${styles.meter} ${over ? styles.meterOver : ""}`} aria-hidden="true">
            <div
              className={styles.meterFill}
              style={{ width: `${available ? Math.min(100, (used / available) * 100) : 0}%` }}
            />
          </div>
          <p id="hide-capacity" className={styles.help}>
            {image
              ? `This image can hold ${formatBytes(available)} with these settings.`
              : "Pick an image to see how much it can hold."}
          </p>
        </div>

        <label className={styles.switch}>
          <span>
            <strong>Encrypt with a passphrase</strong>
            <br />
            <small className={styles.help}>AES-256-GCM, and bits are scattered by the key.</small>
          </span>
          <input type="checkbox" checked={encrypt} onChange={(event) => setEncrypt(event.target.checked)} />
        </label>

        {encrypt && (
          <div className={styles.field}>
            <label htmlFor="hide-passphrase" className={styles.label}>
              Passphrase
            </label>
            <input
              id="hide-passphrase"
              type="password"
              autoComplete="new-password"
              className={styles.input}
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Share it with the reader separately"
            />
            <p className={styles.help}>
              {passphrase.length > 0 && passphrase.length < 12
                ? "Tip: four or more random words make a much stronger passphrase."
                : "Without it, the message cannot be found or read."}
            </p>
          </div>
        )}

        <div className={styles.field}>
          <span className={styles.label} id="depth-label">
            Bits per channel
          </span>
          <div className={styles.segmented} role="radiogroup" aria-labelledby="depth-label">
            {([1, 2] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={depth === value}
                className={styles.segment}
                onClick={() => setDepth(value)}
              >
                <span>{value === 1 ? "Stealth · 1 bit" : "Capacity · 2 bits"}</span>
                <small>{value === 1 ? "Harder to detect" : "Twice the room"}</small>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={!image || over || needsPassphrase || busy}>
            {busy && <span className={styles.spinner} aria-hidden="true" />}
            Hide message
          </button>
          {result && (
            <a className={styles.secondary} href={result.url} download={downloadName}>
              Download PNG · {formatBytes(result.size)}
            </a>
          )}
          {result?.netpbm && (
            <a className={styles.secondary} href={result.netpbm.url} download={netpbmName}>
              Download {netpbmExtension.slice(1).toUpperCase()} · {formatBytes(result.netpbm.size)}
            </a>
          )}
        </div>

        <p className={styles.status} data-tone={status.tone} role="status" aria-live="polite">
          {status.text}
        </p>
      </form>
    </div>
  );
}
