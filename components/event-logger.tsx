"use client";

import { useMemo, useState } from "react";
import { createEvent } from "@/app/actions";
import { UniversityMark } from "@/components/university-mark";
import { VoiceInput } from "@/components/voice-input";

type EventFriend = { id: string; preferredName: string; university: string };
const types = [["coffee", "☕ coffee"], ["lunch", "🥪 lunch"], ["drinks", "🍻 drinks"], ["party", "🪩 party"], ["study", "📚 study"], ["beach", "🏖️ beach"], ["concert", "🎸 gig"], ["society_event", "🏫 society"]];

function inferHangout(text: string) {
  const lower = text.toLowerCase();
  if (/(beach|coogee|bondi|swim)/.test(lower)) return "beach";
  if (/(gig|concert|show)/.test(lower)) return "concert";
  if (/(drink|pub|bar)/.test(lower)) return "drinks";
  if (/(party|kick-on)/.test(lower)) return "party";
  if (/(study|library|assignment)/.test(lower)) return "study";
  if (/(coffee|cafe|matcha)/.test(lower)) return "coffee";
  return "";
}
function inferLocation(text: string) { const match = text.match(/(?:at|in|to)\s+(?:the\s+)?([A-Z][\w' -]{2,40})/); return match?.[1]?.replace(/[,.!?].*$/, "") || ""; }

export function EventLogger({ friends, now }: { friends: EventFriend[]; now: string }) {
  const [title, setTitle] = useState(""); const [notes, setNotes] = useState(""); const [location, setLocation] = useState(""); const [hangoutType, setHangoutType] = useState(""); const [attendees, setAttendees] = useState<string[]>([]); const [captured, setCaptured] = useState(false);
  const selectedNames = useMemo(() => new Set(attendees), [attendees]);
  function capture(transcript: string) {
    const matched = friends.filter((friend) => transcript.toLowerCase().includes(friend.preferredName.toLowerCase())).map((friend) => friend.id);
    setNotes(transcript); setTitle((current) => current || transcript.split(/[.!?]/)[0].slice(0, 120) || "Voice-note hangout"); setLocation((current) => current || inferLocation(transcript)); setHangoutType((current) => current || inferHangout(transcript)); if (matched.length) setAttendees(matched); setCaptured(true);
  }
  function toggle(id: string) { setAttendees((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  return <form action={createEvent} className="px-5 pb-8">
    <section className="voice-log-card"><p className="eyebrow">VOICE MEMORY</p><h2>Just tell Circle what happened.</h2><p>Names, location, how it felt, the weird detail you&apos;ll forget tomorrow. We&apos;ll turn it into the log below.</p><VoiceInput onTranscript={capture} className="voice-log-button" label="Record a hangout memory"/>{captured ? <p className="voice-captured">Saved as a draft from your voice. Check it, then lock it in.</p> : null}</section>
    <label className="label">who was there? (pick at least one)</label><div className="grid grid-cols-2 gap-2">{friends.map((friend) => <label key={friend.id} className="choice justify-center"><input name="attendeeIds" type="checkbox" value={friend.id} checked={selectedNames.has(friend.id)} onChange={() => toggle(friend.id)}/><UniversityMark university={friend.university}/>{friend.preferredName}</label>)}</div>
    <label className="label">what happened?</label><input name="title" required value={title} onChange={(event) => setTitle(event.target.value)} className="input" placeholder="say it out loud, or type a title"/><label className="label">when?</label><input name="happenedAt" type="datetime-local" required defaultValue={now} className="input"/><label className="label">the channel</label><div className="flex flex-wrap gap-2">{[["in_person", "🫂 irl"], ["call", "📞 call"], ["text", "💬 text"], ["social", "🪩 social"], ["class", "🏫 class"]].map(([value, label]) => <label key={value} className="choice"><input type="radio" name="channel" value={value} defaultChecked={value === "in_person"}/>{label}</label>)}</div><label className="label">what kind of hang?</label><div className="flex flex-wrap gap-2">{types.map(([value, label]) => <label key={value} className="choice"><input type="radio" name="hangoutType" value={value} checked={hangoutType === value} onChange={() => setHangoutType(value)}/>{label}</label>)}</div><input name="location" value={location} onChange={(event) => setLocation(event.target.value)} className="input mt-3" placeholder="where? (optional)"/><textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="input mt-2 min-h-28" placeholder="Your voice note appears here, or add a tiny memory..."/><label className="label">vibe check</label><select name="vibe" className="input"><option value="5">⭐⭐⭐⭐⭐ elite</option><option value="4">⭐⭐⭐⭐ good</option><option value="3">⭐⭐⭐ normal</option><option value="2">⭐⭐ meh</option><option value="1">⭐ yikes</option></select><button className="press sticker mt-6 w-full rounded-full bg-[#fffc00] py-4 font-black text-[#17151a]">save the memory ✨</button>
  </form>;
}
