"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type PlannerFriend = {
  id: string;
  name: string;
  nickname: string | null;
  closeness: number;
  crush: string;
  interests: string[];
  societies: string[];
  daysSinceContact: number | null;
};

type Plan = { mood: string; setting: string; size: string; when: string; detail: string };

const quickStarts = [
  { label: "I need low-key company", text: "I want something low-key, cosy and easy after class." },
  { label: "I want to get out", text: "I want to get out tonight and do something a little spontaneous." },
  { label: "Plan a proper 1:1", text: "I want a proper one-on-one catch-up this week." },
  { label: "Find a little crew", text: "I want a small group hang, a few people and good energy." },
];
const presets = { mood: ["soft & social", "chaotic", "need a reset", "romantic-ish"], setting: ["near campus", "Newtown-ish", "outside", "at home"], size: ["just us", "2–3 people", "a small crew"], when: ["today", "tonight", "this week"] };

function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function avatarTone(closeness: number) { return closeness >= 4 ? "#fffc00" : closeness === 3 ? "#ff2d55" : "#00f0ff"; }
function parsePlan(message: string, current: Plan): Plan {
  const text = message.toLowerCase(); const has = (...words: string[]) => words.some((word) => text.includes(word));
  return {
    mood: has("romantic", "date", "crush") ? "romantic-ish" : has("chaos", "party", "wild", "out") ? "chaotic" : has("tired", "reset", "quiet", "chill", "low-key", "cosy") ? "need a reset" : current.mood,
    setting: has("newtown", "gig") ? "Newtown-ish" : has("beach", "outside", "walk", "boulder") ? "outside" : has("home", "movie") ? "at home" : current.setting,
    size: has("group", "crew", "people", "everyone") ? "a small crew" : has("1:1", "one-on-one", "just", "date") ? "just us" : current.size,
    when: has("tonight") ? "tonight" : has("week", "weekend") ? "this week" : current.when, detail: message,
  };
}
function recommendationReason(friend: PlannerFriend, plan: Plan) {
  const interests = friend.interests.join(" ").toLowerCase();
  if (plan.setting === "Newtown-ish" && (interests.includes("gig") || interests.includes("film") || interests.includes("thrift"))) return `They’re into ${friend.interests.slice(0, 2).join(" + ")}, so this feels very them.`;
  if (plan.setting === "outside" && (interests.includes("beach") || interests.includes("boulder") || interests.includes("run"))) return `They’re always down for ${friend.interests[0]}, which fits your outside mood.`;
  if (plan.mood === "chaotic" && (interests.includes("house music") || interests.includes("trivia") || interests.includes("gig"))) return `Their ${friend.interests[0]} energy matches a slightly unplanned night.`;
  if (plan.mood === "need a reset") return friend.daysSinceContact && friend.daysSinceContact > 20 ? `You haven’t had a real moment in ${friend.daysSinceContact} days. This is an easy re-entry.` : `They’re a comfortable pick when you want the plan to feel easy.`;
  if (plan.size === "a small crew") return `${friend.societies[0] || "Your shared orbit"} gives this plan a natural little group-chat route.`;
  return friend.daysSinceContact && friend.daysSinceContact > 14 ? `It’s been ${friend.daysSinceContact} days, and this is a very low-pressure way to reconnect.` : `You two have the right amount of closeness for this kind of plan.`;
}
function activityLabel(plan: Plan, friend: PlannerFriend) {
  const interests = friend.interests.join(" ").toLowerCase();
  if (plan.setting === "Newtown-ish") return interests.includes("gig") ? "tiny gig + post-show chips" : "Newtown wander + something fried";
  if (plan.setting === "outside") return interests.includes("boulder") ? "bouldering then a drink" : interests.includes("beach") ? "beach walk + takeaway" : "sunset lap + snacks";
  if (plan.setting === "at home") return "bad movie + ordered-in dinner";
  if (plan.mood === "chaotic") return "one drink that becomes a night";
  if (plan.mood === "need a reset") return "slow coffee and a proper debrief";
  return plan.size === "a small crew" ? "casual dinner with a few familiar faces" : "a no-rush catch-up after class";
}

export function HangoutPlanner({ friends }: { friends: PlannerFriend[] }) {
  const [draft, setDraft] = useState("");
  const [plan, setPlan] = useState<Plan>({ mood: "soft & social", setting: "near campus", size: "2–3 people", when: "today", detail: "" });
  const [messages, setMessages] = useState<Array<{ from: "you" | "circle"; text: string }>>([]);
  const recommendations = useMemo(() => {
    const score = (friend: PlannerFriend) => { const interests = friend.interests.join(" ").toLowerCase(); let value = friend.closeness * 8 + Math.min(friend.daysSinceContact || 0, 40) / 3; if (plan.size === "just us") value += friend.closeness * 2; if (plan.mood === "romantic-ish" && (friend.crush === "crush" || friend.crush === "dating")) value += 45; if (plan.setting === "Newtown-ish" && /(gig|film|thrift|photo)/.test(interests)) value += 26; if (plan.setting === "outside" && /(beach|boulder|run|pilates)/.test(interests)) value += 26; if (plan.mood === "chaotic" && /(house music|trivia|gig|footy)/.test(interests)) value += 20; if (plan.mood === "need a reset" && /(matcha|ramen|pilates|beach)/.test(interests)) value += 14; return value; };
    return [...friends].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [friends, plan]);
  function send(text = draft) { const trimmed = text.trim(); if (!trimmed) return; const nextPlan = parsePlan(trimmed, plan); setPlan(nextPlan); setMessages((current) => [...current, { from: "you", text: trimmed }, { from: "circle", text: `Got it. I’m looking for ${nextPlan.mood}, ${nextPlan.size}, ${nextPlan.when.toLowerCase()}. These are the people I’d actually text first.` }]); setDraft(""); }
  function choose(field: keyof Omit<Plan, "detail">, value: string) { setPlan((current) => ({ ...current, [field]: value })); }
  return <>
    <header className="planner-top"><div className="planner-mark"><span className="planner-mark-dot"/> Circle</div><button className="planner-profile" aria-label="Open your profile">T</button></header>
    <main className="planner-main">
      <section className="planner-intro" aria-labelledby="planner-title"><p className="eyebrow">YOUR PEOPLE, ON YOUR TERMS</p><h1 id="planner-title">What kind of day<br/>do you want to have?</h1><p>Tell me the mood. I’ll find the people who make that plan feel right.</p></section>
      <section className="conversation" aria-label="Plan a hangout"><div className="assistant-bubble"><span className="spark">✦</span><p>Start anywhere. “I need to get out”, “quiet catch-up”, “who’s good for a beach day?”</p></div>{messages.map((message, index) => <div key={`${message.text}-${index}`} className={`message ${message.from === "you" ? "message-you" : "message-circle"}`}>{message.text}</div>)}<div className="quick-starts" aria-label="Quick ways to start">{quickStarts.map((start) => <button key={start.label} onClick={() => send(start.text)} className="quick-chip">{start.label}</button>)}</div><form className="prompt-box" onSubmit={(event) => { event.preventDefault(); send(); }}><label className="sr-only" htmlFor="hangout-prompt">Describe your ideal hangout</label><textarea id="hangout-prompt" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Describe the hang..." rows={2}/><button type="submit" className="send-button" aria-label="Find people for this plan">↑</button></form><p className="privacy-note"><span>◌</span> Only uses the people you’ve saved here. Nothing gets messaged for you.</p></section>
      <section className="shape-plan" aria-labelledby="shape-plan-title"><div className="section-heading"><p className="eyebrow">TUNE THE VIBE</p><h2 id="shape-plan-title">Make it yours</h2></div><div className="plan-controls">{(Object.entries(presets) as Array<[keyof Omit<Plan, "detail">, string[]]>).map(([field, options]) => <div className="plan-control" key={field}><span>{field}</span><div>{options.map((option) => <button key={option} onClick={() => choose(field, option)} aria-pressed={plan[field] === option} className={plan[field] === option ? "selected" : ""}>{option}</button>)}</div></div>)}</div></section>
      <section className="matches" aria-labelledby="matches-title"><div className="matches-heading"><div><p className="eyebrow">YOUR BEST BETS</p><h2 id="matches-title">Text these people</h2></div><span>{plan.when}</span></div>{friends.length ? <div className="match-list">{recommendations.map((friend, index) => <article className="match" key={friend.id}><div className="match-number">0{index + 1}</div><div className="avatar" style={{ "--avatar-tone": avatarTone(friend.closeness) } as React.CSSProperties}>{initials(friend.name)}{(friend.crush === "crush" || friend.crush === "dating") && <i>♥</i>}</div><div className="match-main"><div className="match-name"><h3>{friend.nickname || friend.name}</h3><span>{friend.interests.slice(0, 2).join(" · ")}</span></div><p>{recommendationReason(friend, plan)}</p><div className="match-plan"><span>↗</span>{activityLabel(plan, friend)}</div></div><Link className="match-link" href={`/friends/${friend.id}`} aria-label={`View ${friend.name}`}>↗</Link></article>)}</div> : <div className="no-people"><p>Your plans will get personal once you add a few people.</p><Link href="/friends/new">Add someone</Link></div>}<button className="refresh-match" onClick={() => setPlan((current) => ({ ...current, mood: current.mood === "soft & social" ? "chaotic" : "soft & social" }))}>↻ show me a different energy</button></section>
    </main>
  </>;
}
