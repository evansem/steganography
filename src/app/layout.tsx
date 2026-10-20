import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Justeg · hide words in plain sight",
  description:
    "A browser steganography lab. Hide encrypted text inside images. Nothing is uploaded: every pixel is processed on your device.",
};

export const viewport: Viewport = {
  themeColor: "#07060b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
