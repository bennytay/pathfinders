import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { DemoBootstrap } from "@/components/demo-bootstrap";
export const metadata: Metadata = { title: "Circle, plans with your people", description: "Tell Circle the hangout you want. It finds the people to make it happen." };
const tabs = [["/", "✦", "Plan"], ["/friends", "👥", "People"], ["/events/new", "＋", "Log"], ["/catchup", "◌", "Catchup"]];
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><DemoBootstrap/><main className="phone-shell">{children}</main><nav aria-label="Main navigation" className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 items-end justify-around border-t-2 border-[#393542] bg-[#201d26] px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2">{tabs.map(([href, emoji, label]) => <Link key={href} href={href} className={`press flex min-w-14 flex-col items-center gap-0.5 rounded-2xl px-2 pb-0.5 text-[11px] font-black ${label === "Log" ? "-mt-7 border-2 border-black bg-[#fffc00] px-4 py-2 text-[#17151a] shadow-[3px_3px_0_#08080a]" : "text-[#c9c4d2]"}`}><span className="text-xl">{emoji}</span><span>{label}</span></Link>)}</nav></body></html>; }
