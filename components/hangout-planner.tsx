"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UniversityMark } from "@/components/university-mark";
import { VoiceInput } from "@/components/voice-input";

export type PlannerFriend = { id: string; name: string; nickname: string | null; university: string; closeness: number; crush: string; interests: string[]; societies: string[]; daysSinceContact: number | null };
type Plan = { mood: string; setting: string; size: string; when: string };
type ChatReply = { reply: string; plan: Plan; recommendedFriendIds: string[]; reasons: Record<string, string> };
type ChatError = { error?: string };

function parsePlan(message: string): Plan {
  const text = message.toLowerCase(); const has = (...words: string[]) => words.some((word) => text.includes(word));
  return { mood: has("date", "crush", "romantic") ? "romantic" : has("party", "chaos", "out") ? "going-out" : has("tired", "chill", "quiet", "low-key", "cosy") ? "low-key" : "social", setting: has("beach", "walk", "boulder", "outside") ? "outside" : has("newtown", "gig") ? "Newtown" : has("home", "movie") ? "at home" : "near campus", size: has("group", "crew", "everyone") ? "a crew" : has("one-on-one", "1:1", "just us", "date") ? "a 1:1" : "a few people", when: has("tonight") ? "tonight" : has("weekend", "this week") ? "this week" : "today" };
}
function score(friend: PlannerFriend, plan: Plan) { const interests = friend.interests.join(" ").toLowerCase(); let value = friend.closeness * 8 + Math.min(friend.daysSinceContact || 0, 42) / 3; if (plan.size === "a 1:1") value += friend.closeness * 2; if (plan.mood === "romantic" && (friend.crush === "crush" || friend.crush === "dating")) value += 45; if (plan.setting === "Newtown" && /(gig|film|thrift|photo)/.test(interests)) value += 24; if (plan.setting === "outside" && /(beach|boulder|run|pilates)/.test(interests)) value += 24; if (plan.mood === "going-out" && /(house music|trivia|gig|footy)/.test(interests)) value += 18; return value; }
function localReason(friend: PlannerFriend, plan: Plan) { const interests = friend.interests.join(" ").toLowerCase(); if (plan.setting === "outside" && /(beach|boulder|run|pilates)/.test(interests)) return `${friend.interests[0]} is exactly the energy for this.`; if (plan.setting === "Newtown" && /(gig|film|thrift|photo)/.test(interests)) return `Their ${friend.interests[0]} side makes this feel natural.`; if (friend.daysSinceContact && friend.daysSinceContact > 20) return `It’s been ${friend.daysSinceContact} days. This is an easy way back in.`; return `${plan.size} feels right for where you two are at.`; }

export function HangoutPlanner({ friends }: { friends: PlannerFriend[] }) {
  const [draft, setDraft] = useState(""); const [messages, setMessages] = useState<Array<{ from: "you" | "circle"; text: string }>>([]); const [plan, setPlan] = useState<Plan | null>(null); const [recommendedIds, setRecommendedIds] = useState<string[]>([]); const [reasons, setReasons] = useState<Record<string, string>>({}); const [thinking, setThinking] = useState(false); const [error, setError] = useState<string | null>(null);
  const localRecommendations = useMemo(() => plan ? [...friends].sort((a, b) => score(b, plan) - score(a, plan)).slice(0, 3) : [], [friends, plan]);
  const recommendations = useMemo(() => { const byId = new Map(friends.map((friend) => [friend.id, friend])); return recommendedIds.length ? recommendedIds.map((id) => byId.get(id)).filter((friend): friend is PlannerFriend => Boolean(friend)) : localRecommendations; }, [friends, localRecommendations, recommendedIds]);
  async function send(message = draft) {
    const text = message.trim(); if (!text || thinking) return;
    const fallbackPlan = parsePlan(text); setDraft(""); setError(null); setPlan(fallbackPlan); setRecommendedIds([]); setReasons({}); setMessages((current) => [...current, { from: "you", text }]); setThinking(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      if (!response.ok) {
        const failure = await response.json().catch(() => null) as ChatError | null;
        throw new Error(failure?.error || "Circle AI is unavailable right now.");
      }
      const answer = await response.json() as ChatReply;
      setPlan(answer.plan); setRecommendedIds(answer.recommendedFriendIds); setReasons(answer.reasons); setMessages((current) => [...current, { from: "circle", text: answer.reply }]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Circle AI is unavailable right now.";
      setError(message);
      setMessages((current) => [...current, { from: "circle", text: `I couldn’t reach Gemini, so here’s a local starting point: ${fallbackPlan.mood}, ${fallbackPlan.size}, ${fallbackPlan.when}, ${fallbackPlan.setting}.` }]);
    } finally { setThinking(false); }
  }
  return <main className="agent-screen"><div className="agent-ambient agent-ambient-one"/><div className="agent-ambient agent-ambient-two"/><Link href="/friends" className="agent-exit">← My circle</Link><section className="agent-conversation" aria-label="Circle AI chat">{messages.length === 0 ? <div className="agent-empty"><div className="agent-orb"/><p className="agent-kicker">CIRCLE AI</p><h1>What kind of day<br/>are we making?</h1><p>Say it however it comes out. I&apos;ll turn it into a plan with your people.</p></div> : <div className="agent-thread">{messages.map((message, index) => <p className={`agent-message agent-message-${message.from}`} key={`${message.text}-${index}`}>{message.text}</p>)}{thinking ? <p className="agent-thinking"><i/> Circle is thinking about your people</p> : null}{error ? <p className="agent-error" role="status">{error}</p> : null}{recommendations.length && !thinking ? <div className="agent-suggestions" aria-label="Recommended people">{recommendations.map((friend) => <article key={friend.id} className="agent-suggestion"><div><span className="agent-avatar">{friend.name.slice(0, 1)}</span><div><div className="agent-friend"><h2>{friend.nickname || friend.name}</h2><UniversityMark university={friend.university}/></div><p>{reasons[friend.id] || localReason(friend, plan!)}</p></div></div><Link href={`/friends/${friend.id}`} aria-label={`View ${friend.name}`}>↗</Link></article>)}</div> : null}</div>}</section><form className="agent-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><label className="sr-only" htmlFor="agent-prompt">Tell Circle what you want to do</label><textarea id="agent-prompt" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Talk it out..." disabled={thinking}/><VoiceInput onTranscript={(transcript) => { void send(transcript); }} label="Speak to Circle"/><button type="submit" className="agent-send" aria-label="Send message" disabled={thinking}>{thinking ? "·" : "↑"}</button></form><p className="agent-privacy">When AI is on, your request and a minimal contact summary go to Gemini. Nothing gets messaged or saved without you.</p></main>;
}
