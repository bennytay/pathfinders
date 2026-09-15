import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const captionFont = Playfair_Display({ subsets: ["latin"], style: ["italic"], weight: ["500", "600"], variable: "--font-caption" });

export const metadata: Metadata = {
  title: "Circle: more time in the room",
  description: "A private, local-first way to remember context and make real-life plans with people you care about.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={captionFont.variable}><body>{children}</body></html>;
}
