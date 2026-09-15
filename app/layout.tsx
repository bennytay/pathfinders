import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Circle: more time in the room",
  description: "A private, local-first way to remember context and make real-life plans with people you care about.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
