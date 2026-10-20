"use client";

import { useState } from "react";
import { decodeImage, type LoadedImage } from "@/lib/image";
import { friendlyError } from "@/lib/messages";
import styles from "./Controls.module.css";
import { RevealPanel } from "./RevealPanel";
import { IDLE, StatusMessage, type Status } from "./StatusMessage";

interface Loaded {
  image: LoadedImage;
  source: string;
}

/**
 * Fetches a website's favicon through the server-side proxy, then hands it
 * to the reveal tool. Tiny icons are a classic hiding place for eggs.
 */
export function FaviconPanel() {
  const [site, setSite] = useState("");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);

  async function load(url: string, label: string, sourceFrom?: (response: Response) => string) {
    setBusy(true);
    setStatus({ tone: "idle", text: `Fetching the icon for ${label}…` });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The icon could not be fetched.");
      }
      const blob = await response.blob();
      const source = sourceFrom?.(response) ?? label;
      setLoaded({ image: await decodeImage(blob, source.split("/").pop() || label), source });
      setStatus(IDLE);
    } catch (error) {
      // TypeError means the request itself failed; other errors carry a readable message.
      const text = error instanceof Error && !(error instanceof TypeError) ? error.message : friendlyError(error);
      setStatus({ tone: "error", text });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.controls}>
      <form
        className={styles.field}
        onSubmit={(event) => {
          event.preventDefault();
          if (site.trim()) {
            void load(`/api/favicon?site=${encodeURIComponent(site.trim())}`, site.trim(), (response) =>
              decodeURI(response.headers.get("x-favicon-source") ?? site),
            );
          }
        }}
      >
        <label htmlFor="favicon-site" className={styles.label}>
          Website
        </label>
        <div className={styles.actions}>
          <input
            id="favicon-site"
            className={`${styles.input} ${styles.grow}`}
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="example.com"
            value={site}
            onChange={(event) => setSite(event.target.value)}
          />
          <button type="submit" className={styles.primary} disabled={busy || !site.trim()}>
            {busy && <span className={styles.spinner} aria-hidden="true" />}
            Fetch icon
          </button>
          <button
            type="button"
            className={styles.secondary}
            disabled={busy}
            onClick={() => void load("/icon.png", "Justeg's own icon", () => `${location.origin}/icon.png`)}
          >
            Try Justeg&apos;s icon 🥚
          </button>
        </div>
        <p className={styles.help}>
          The server fetches only public web addresses, follows at most three redirects and returns raster images.
          Everything after that happens in your browser.
        </p>
        <StatusMessage status={status} />
      </form>

      {loaded && (
        <RevealPanel
          key={loaded.source + loaded.image.width}
          initialImage={loaded.image}
          intro={
            <p className={styles.help}>
              Loaded <code className={styles.wrapAnywhere}>{loaded.source}</code> ({loaded.image.width}×
              {loaded.image.height}). Reveal to look for a hidden message.
            </p>
          }
        />
      )}
    </div>
  );
}
