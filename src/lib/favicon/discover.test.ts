import { describe, expect, it } from "vitest";
import { findIconLinks, rankIcons } from "./discover";

const base = new URL("https://example.com/blog/post");

describe("findIconLinks", () => {
  it("reads icon links in any attribute order and quoting style", () => {
    const html = `<html><head>
      <link href="/a.png" rel="icon" sizes="32x32">
      <link rel='shortcut icon' href='/favicon.ico'>
      <link rel=apple-touch-icon href=/touch.png>
      <link rel="stylesheet" href="/style.css">
    </head><body><link rel="icon" href="/ignored-body.png"></body></html>`;
    expect(findIconLinks(html).map((l) => l.href)).toEqual(["/a.png", "/favicon.ico", "/touch.png"]);
  });

  it("decodes entities in href", () => {
    expect(findIconLinks(`<link rel="icon" href="/i.png?a=1&amp;b=2">`)[0]?.href).toBe("/i.png?a=1&b=2");
  });
});

describe("rankIcons", () => {
  it("prefers icons near 64px, drops SVG and unsafe schemes, ends with /favicon.ico", () => {
    const urls = rankIcons(
      [
        { href: "/16.png", rel: "icon", size: 16 },
        { href: "/vector.svg", rel: "icon", size: 0 },
        { href: "/typed", rel: "icon", type: "image/svg+xml", size: 0 },
        { href: "javascript:alert(1)", rel: "icon", size: 64 },
        { href: "data:image/png;base64,AAAA", rel: "icon", size: 64 },
        { href: "https://cdn.example.net/64.png", rel: "icon", size: 64 },
      ],
      base,
    ).map((u) => u.href);
    expect(urls).toEqual([
      "https://cdn.example.net/64.png",
      "https://example.com/16.png",
      "https://example.com/favicon.ico",
    ]);
  });

  it("does not repeat /favicon.ico", () => {
    const urls = rankIcons([{ href: "/favicon.ico", rel: "icon", size: 0 }], base);
    expect(urls).toHaveLength(1);
  });
});
