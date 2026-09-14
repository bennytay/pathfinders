import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "InnerCircle — private context for close friends",
  description: "A local-first, user-controlled context layer for a small circle of close friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
