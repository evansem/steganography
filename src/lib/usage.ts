/** Fire-and-forget anonymous usage ping. Failures are ignored on purpose. */
export function recordUsage(event: "hide" | "reveal"): void {
  void fetch("/api/stats", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}
