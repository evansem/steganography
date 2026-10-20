"use client";

import { useState, type ReactNode } from "react";
import { decodeImage, type LoadedImage } from "@/lib/image";
import { friendlyError } from "@/lib/messages";
import { reveal, type Revealed } from "@/lib/stego";
import styles from "./Controls.module.css";
import { DevelopingText } from "./DevelopingText";
import { DropZone } from "./DropZone";
import { ImageStage } from "./ImageStage";
import { IDLE, StatusMessage, type Status } from "./StatusMessage";

interface Props {
  /** Preloaded image, e.g. a fetched favicon. */
  initialImage?: LoadedImage | null;
  intro?: ReactNode;
}

export function RevealPanel({ initialImage = null, intro }: Props) {
  const [image, setImage] = useState<LoadedImage | null>(initialImage);
  const [passphrase, setPassphrase] = useState("");
  const [found, setFound] = useState<Revealed | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  async function load(file: File) {
    setFound(null);
    setStatus({ tone: "idle", text: "Reading image…" });
    try {
      setImage(await decodeImage(file, file.name));
      setStatus(IDLE);
    } catch (error) {
      setStatus({ tone: "error", text: friendlyError(error) });
    }
  }

  async function run() {
    if (!image) return;
    setBusy(true);
    setFound(null);
    setStatus({ tone: "idle", text: passphrase ? "Deriving key and searching…" : "Reading the lowest bits…" });
    try {
      const revealed = await reveal(image, passphrase || undefined, { legacy: image.format === "netpbm" });
      setFound(revealed);
      setStatus({ tone: "success", text: "Message recovered." });
    } catch (error) {
      setStatus({
        tone: "error",
        text: passphrase ? friendlyError(error) : `${friendlyError(error)} If it was encrypted, enter the passphrase.`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div>
        {image ? (
          <ImageStage
            original={image}
            onClear={() => {
              setImage(null);
              setFound(null);
            }}
          />
        ) : (
          <DropZone label="Drop an image to inspect" onFile={load} />
        )}
      </div>

      <form
        className={styles.controls}
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        {intro}
        <div className={styles.field}>
          <label htmlFor="reveal-passphrase" className={styles.label}>
            Passphrase <span className={styles.help}>(leave empty for unencrypted messages)</span>
          </label>
          <input
            id="reveal-passphrase"
            type="password"
            autoComplete="off"
            className={styles.input}
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={!image || busy}>
            {busy && <span className={styles.spinner} aria-hidden="true" />}
            Reveal message
          </button>
        </div>

        <StatusMessage status={status} />

        {found && (
          <div className={styles.field}>
            <div className={styles.badges}>
              <span className={styles.badge} data-on={found.encrypted}>
                {found.encrypted ? "AES-GCM verified" : "Unencrypted"}
              </span>
              <span className={styles.badge}>{found.depth}-bit LSB</span>
              {found.legacy && <span className={styles.badge}>2022 prototype format</span>}
            </div>
            <output className={styles.output} htmlFor="reveal-passphrase">
              {found.text ? <DevelopingText key={found.text} text={found.text} /> : <em>(empty message)</em>}
            </output>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => void navigator.clipboard.writeText(found.text)}
              >
                Copy text
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
