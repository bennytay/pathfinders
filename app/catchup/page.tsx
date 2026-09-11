import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { relationshipSnapshot } from "@/lib/relationship";
import { UniversityMark } from "@/components/university-mark";
import { nowDate } from "@/lib/social-time";

const DAY = 86_400_000;

export default async function Catchup() {
  await connection();
  const [friends, events] = await Promise.all([
    db.friend.findMany({ orderBy: [{ closeness: "desc" }, { preferredName: "asc" }] }),
    db.event.findMany({ orderBy: { happenedAt: "desc" }, include: { attendees: { include: { friend: true } } } }),
  ]);
  const now = nowDate();
  const people = friends.map((friend) => ({ ...friend, snapshot: relationshipSnapshot({ ...friend, now }) }));
  const recentEvents = events.filter((event) => now.getTime() - event.happenedAt.getTime() <= 30 * DAY);
  const peopleSeenRecently = new Set(recentEvents.flatMap((event) => event.attendees.map(({ friendId }) => friendId))).size;
  const atRisk = people.filter(({ closeness, snapshot }) => closeness >= 4 && snapshot.overdue).sort((a, b) => ((b.snapshot.daysSinceContact || 0) / b.snapshot.stayInTouchDays) - ((a.snapshot.daysSinceContact || 0) / a.snapshot.stayInTouchDays));
  const nudges = people.filter((person) => person.snapshot.overdue && !atRisk.some((friend) => friend.id === person.id)).sort((a, b) => (b.snapshot.daysSinceContact || 0) - (a.snapshot.daysSinceContact || 0));
  const typeCounts = events.reduce<Record<string, number>>((counts, event) => { const type = event.hangoutType || event.channel; counts[type] = (counts[type] || 0) + 1; return counts; }, {});
  const activityTypes = Object.entries(typeCounts).sort(([, a], [, b]) => b - a).slice(0, 3);
  const weeklyActivity = [3, 2, 1, 0].map((week) => events.filter((event) => { const age = now.getTime() - event.happenedAt.getTime(); return age >= week * 7 * DAY && age < (week + 1) * 7 * DAY; }).length).reverse();
  const maxWeek = Math.max(...weeklyActivity, 1);
  const lastHangoutDays = events[0] ? Math.floor((now.getTime() - events[0].happenedAt.getTime()) / DAY) : null;

  return <main className="catchup-page"><header className="catchup-top"><div><p className="eyebrow">YOUR SOCIAL PULSE</p><h1>Catchup</h1></div><Link href="/events/new" className="catchup-log">+ log a hang</Link></header>
    <section className="catchup-summary"><p>{atRisk.length ? `${atRisk.length} close connection${atRisk.length === 1 ? "" : "s"} need a little love.` : "Your close friendships are feeling cared for."}</p><span>{lastHangoutDays === null ? "No hangs logged yet" : lastHangoutDays === 0 ? "You hung out today" : `Last hang: ${lastHangoutDays}d ago`}</span></section>
    <section className="catchup-metrics" aria-label="Last 30 days"><article><strong>{recentEvents.length}</strong><span>hangs in 30d</span></article><article><strong>{peopleSeenRecently}</strong><span>people seen</span></article><article><strong>{activityTypes[0]?.[0]?.replaceAll("_", " ") || "—"}</strong><span>usual move</span></article></section>
    <section className="catchup-section"><div className="catchup-section-title"><div><p className="eyebrow">ACTION QUEUE</p><h2>Do this next</h2></div><span>{atRisk.length + nudges.length} open</span></div>{atRisk.length || nudges.length ? <div className="catchup-actions">{atRisk.slice(0, 2).map((friend) => <Action key={friend.id} friend={friend} level="protect" text={`You’re ${Math.max(1, (friend.snapshot.daysSinceContact || 0) - friend.snapshot.stayInTouchDays)} days past your usual rhythm. Send something easy today.`}/>) }{nudges.slice(0, Math.max(0, 3 - atRisk.length)).map((friend) => <Action key={friend.id} friend={friend} level="nudge" text={`It’s been ${friend.snapshot.daysSinceContact} days. A low-stakes catch-up would keep this warm.`}/>)}</div> : <div className="catchup-empty">Nothing urgent. Keep logging the little hangs so this stays honest.</div>}</section>
    <section className="catchup-section"><div className="catchup-section-title"><div><p className="eyebrow">YOUR RHYTHM</p><h2>How you&apos;ve been showing up</h2></div><span>4 weeks</span></div><div className="rhythm-card"><div className="rhythm-chart" aria-label={`${recentEvents.length} hangouts in the last thirty days`}>{weeklyActivity.map((count, index) => <div key={index} className="rhythm-column"><i style={{ height: `${Math.max(10, (count / maxWeek) * 100)}%` }}/><span>{index === 3 ? "now" : `${3 - index}w`}</span></div>)}</div><div className="rhythm-detail"><p>Most often you&apos;re doing</p><div>{activityTypes.length ? activityTypes.map(([type, count]) => <span key={type}>{type.replaceAll("_", " ")} <b>{count}</b></span>) : <span>nothing logged yet</span>}</div></div></div></section>
    <section className="catchup-section catchup-orbit"><div className="catchup-section-title"><div><p className="eyebrow">WHO&apos;S IN THE LOOP</p><h2>Your orbit</h2></div><Link href="/friends">see all</Link></div><div className="orbit-list">{people.slice(0, 5).map((friend) => { const status = friend.snapshot.overdue ? "needs a nudge" : "in the loop"; return <Link href={`/friends/${friend.id}`} key={friend.id}><UniversityMark university={friend.university}/><span><b>{friend.nickname || friend.preferredName}</b><small>{friend.snapshot.daysSinceContact === null ? "no contact logged" : `${friend.snapshot.daysSinceContact}d since contact`}</small></span><em className={friend.snapshot.overdue ? "warm" : "cool"}>{status}</em></Link>; })}</div></section>
  </main>;
}

function Action({ friend, level, text }: { friend: { id: string; preferredName: string; nickname: string | null; university: string }; level: "protect" | "nudge"; text: string }) {
  return <article className={`catchup-action ${level}`}><UniversityMark university={friend.university}/><div><p>{level === "protect" ? "protect this one" : "gentle nudge"}</p><h3>{friend.nickname || friend.preferredName}</h3><span>{text}</span></div><Link href={`/friends/${friend.id}`} aria-label={`View ${friend.preferredName}`}>↗</Link></article>;
}
