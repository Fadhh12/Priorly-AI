import type { Metadata } from "next";
import { IBM_Plex_Mono, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TradeSim — Trading Saham Real-Time",
  description:
    "Pasang order, pantau order book, dan baca insight AI untuk 10 saham populer — semua real-time lewat WebSocket.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${sora.variable} ${plexMono.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Icon glyphs for the Trading App (Terminal Onyx) sidebar/toolbar — only these icons are used, loaded globally to keep this to one <link>. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
