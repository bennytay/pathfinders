"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UniversityMark } from "@/components/university-mark";
import { VoiceInput } from "@/components/voice-input";

export type PlannerFriend = { id: string; name: string; nickname: string | null; university: string; closeness: number; crush: string; interests: string[]; societies: string[]; daysSinceContact: number | null };
type Plan = { mood: string; setting: string; size: string; when: string };

function parsePlan(message: string): Plan {
  const text = message.toLowerCase(); const has = (...words: string[]) => words.some((word) => text.includes(word));
  return {
    mood: has("date", "crush", "romantic") ? "romantic" : has("party", "chaos", "out") ? "going-out" : has("tired", "chill", "quiet", "low-key", "cosy") ? "low-key" : "social",
    setting: has("beach", "walk", "boulder", "outside") ? "outside" : has("newtown", "gig") ? "Newtown" : has("home", "movie") ? "at home" : "near campus",
    size: has("group", "crew", "everyone") ? "a crew" : has("one-on-one", "1:1", "just us", "date") ? "a 1:1" : "a few people",
    when: has("tonight") ? "tonight" : has("weekend", "this week") ? "this week" : "today",
  };
}
function score(friend: PlannerFriend, plan: Plan) {
  const interests = friend.interests.join(" ").toLowerCase(); let value = friend.closeness * 8 + Math.min(friend.daysSinceContact || 0, 42) / 3;
  if (plan.size === "a 1:1") value += friend.closeness * 2;
  if (plan.mood === "romantic" && (friend.crush === "crush" || friend.crush === "dating")) value += 45;
  if (plan.setting === "Newtown" && /(gig|film|thrift|photo)/.test(interests)) value += 24;
  if (plan.setting === "outside" && /(beach|boulder|run|pilates)/.test(interests)) value += 24;
  if (plan.mood === "going-out" && /(house music|trivia|gig|footy)/.test(interests)) value += 18;
  return value;
}
function reason(friend: PlannerFriend, plan: Plan) {
  const interests = friend.interests.join(" ").toLowerCase();
  if (plan.setting === "outside" && /(beach|boulder|run|pilates)/.test(interests)) return `${friend.interests[0]} is exactly the energy for this.`;
  if (plan.setting === "Newtown" && /(gig|film|thrift|photo)/.test(interests)) return `Their ${friend.interests[0]} side makes this feel natural.`;
  if (friend.daysSinceContact && friend.daysSinceContact > 20) return `It’s been ${friend.daysSinceContact} days. This is an easy way back in.`;
  return `${plan.size} feels right for where you two are at.`;
}

export function HangoutPlanner({ friends }: { friends: PlannerFriend[] }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Array<{ from: "you" | "circle"; text: string }>>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const recommendations = useMemo(() => plan ? [...friends].sort((a, b) => score(b, plan) - score(a, plan)).slice(0, 3) : [], [friends, plan]);
  function send(message = draft) {
    const text = message.trim(); if (!text) return;
    const nextPlan = parsePlan(text); setPlan(nextPlan); setMessages((current) => [...current, { from: "you", text }, { from: "circle", text: `I heard ${nextPlan.mood}, ${nextPlan.size}, ${nextPlan.when}, ${nextPlan.setting}. I’d start here.` }]); setDraft("");
  }
  return <main className="agent-screen">
    <div className="agent-ambient agent-ambient-one"/><div className="agent-ambient agent-ambient-two"/>
    <Link href="/friends" className="agent-exit">← My circle</Link>
    <section className="agent-conversation" aria-label="Circle AI chat">
      {messages.length === 0 ? <div className="agent-empty"><div className="agent-orb"/><p className="agent-kicker">CIRCLE AI</p><h1>What kind of day<br/>are we making?</h1><p>Say it however it comes out. I&apos;ll turn it into a plan with your people.</p></div> : <div className="agent-thread">{messages.map((message, index) => <p className={`agent-message agent-message-${message.from}`} key={`${message.text}-${index}`}>{message.text}</p>)}{recommendations.length ? <div className="agent-suggestions" aria-label="Recommended people">{recommendations.map((friend) => <article key={friend.id} className="agent-suggestion"><div><span className="agent-avatar">{friend.name.slice(0, 1)}</span><div><div className="agent-friend"><h2>{friend.nickname || friend.name}</h2><UniversityMark university={friend.university}/></div><p>{reason(friend, plan!)}</p></div></div><Link href={`/friends/${friend.id}`} aria-label={`View ${friend.name}`}>↗</Link></article>)}</div> : null}</div>}
    </section>
    <form className="agent-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><label className="sr-only" htmlFor="agent-prompt">Tell Circle what you want to do</label><textarea id="agent-prompt" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Talk it out..."/><VoiceInput onTranscript={send} label="Speak to Circle"/><button type="submit" className="agent-send" aria-label="Send message">↑</button></form>
    <p className="agent-privacy">Your voice is transcribed for this plan. Circle only reads the people you&apos;ve saved.</p>
  </main>;
}
