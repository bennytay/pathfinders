import Link from "next/link";
import { db } from "@/lib/db";
import { PageTop } from "@/components/circle-ui";
import { EventLogger } from "@/components/event-logger";
import { localDateTimeNow } from "@/lib/social-time";
export default async function NewEvent() { const friends = await db.friend.findMany({ orderBy: { preferredName: "asc" } }); return <><PageTop kicker="fast, no yapping" title="log the night 📸" action={<Link href="/events" className="text-sm font-black text-[#00f0ff]">cancel</Link>}/><EventLogger friends={friends.map(({ id, preferredName, university }) => ({ id, preferredName, university }))} now={localDateTimeNow()}/></>; }
