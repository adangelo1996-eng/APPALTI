import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RFP AI Co-Pilot",
  description: "Copilot per la redazione di offerte tecniche e gestione bandi di gara",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
