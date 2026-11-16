import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"], style: ["normal","italic"], display: "swap" });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), title: { default: "OFF GRAVITY by The Great Inflate Run", template: "%s | OFF GRAVITY" }, description: "India's first play-fitness festival. Two days. Six cities. A timed inflatable obstacle race with a festival built around it." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className={archivo.variable}><body>{children}</body></html>);
}
