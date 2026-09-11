import Link from "next/link";
import { getFriends } from "@/lib/demo-data";
import { PageTop } from "@/components/circle-ui";
import { EventLogger } from "@/components/event-logger";
import { localDateTimeNow } from "@/lib/social-time";
export default async function NewEvent() { const friends = await getFriends(); return <><PageTop kicker="fast, no yapping" title="log the night 📸" action={<Link href="/events" className="text-sm font-black text-[#00f0ff]">cancel</Link>}/><EventLogger friends={friends.map(({ id, preferred_name, university }) => ({ id, preferredName: preferred_name, university }))} now={localDateTimeNow()}/></>; }
