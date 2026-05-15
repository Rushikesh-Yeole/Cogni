import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COGNI : Cognitive Biometric Layer",
  description:
    "Next-generation biometric identity derived from human cognitive friction and decision-making latencies.",
  keywords: [
    "biometric authentication",
    "cognitive fingerprint",
    "OCEAN model",
    "psychometric",
    "AI security",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
