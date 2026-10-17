import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Justeg",
  description: "Hide encrypted text inside images, right in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#07060b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
