import type { Metadata } from "next";
import { JetBrains_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mono" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "ShipSafe | System Secure",
  description: "Cyberpunk-style security scanner for your repositories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${rajdhani.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="scan-line"></div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
