import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/doto";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import "./dither.css";

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
