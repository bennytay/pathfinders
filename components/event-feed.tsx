"use client";

import { useState } from "react";
import type { Activity, WorkspaceState } from "@/lib/workspace";

export function EventFeed({ state, onPlan }: { state: WorkspaceState; onPlan: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = state.activities;
  const selected = events.find((event) => event.id === selectedId);
  const suggested = selected ? inviteesFor(selected, state) : [];

  return <section className="event-feed" aria-label="Events near you">
    <header className="event-feed-head"><div><p>Tonight in {state.city || "your area"}</p><h1>Find a plan.</h1></div><button className="event-location" type="button">{state.city || "Nearby"}<span aria-hidden="true">⌄</span></button></header>
    <div className="event-filters" aria-label="Event filters"><button className="active" type="button">For you</button><button type="button">This week</button><button type="button">Free</button><button type="button">Outdoors</button></div>
    <EventShelf title="Happening soon" events={events.slice(0, 6)} selectedId={selectedId} onSelect={setSelectedId} />
    <EventShelf title="Make something" events={events.slice(6, 12)} selectedId={selectedId} onSelect={setSelectedId} />
    <EventShelf title="More around Sydney" events={events.slice(12)} selectedId={selectedId} onSelect={setSelectedId} />
    {selected && <aside className="invite-sheet" aria-live="polite"><div><span className={`event-thumb theme-${themeFor(selected.id)}`} aria-hidden="true" /><div><strong>{selected.title}</strong><p>Good people for this</p></div></div><div className="invite-people">{suggested.map((friend) => <span key={friend.id} title={friend.displayName}>{initials(friend.displayName)}</span>)}</div><button className="invite-button" onClick={onPlan}>Plan with {suggested[0]?.displayName.split(" ")[0] ?? "friends"}</button></aside>}
  </section>;
}

function EventShelf({ title, events, selectedId, onSelect }: { title: string; events: Activity[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <section className="event-shelf"><h2>{title}</h2><div className="event-grid">{events.map((event) => <button className={event.id === selectedId ? "event-card selected" : "event-card"} key={event.id} onClick={() => onSelect(event.id)}><span className={`event-art theme-${themeFor(event.id)}`}><span>{event.tags[0]}</span><b>{event.title}</b></span><strong>{event.title}</strong><small>{event.details} · {event.location}</small></button>)}</div></section>;
}

function inviteesFor(event: Activity, state: WorkspaceState) {
  const tags = new Set(event.tags.map((tag) => tag.toLowerCase()));
  const matched = state.friends.filter((friend) => state.memoryFacts.some((memory) => memory.friendId === friend.id && [...tags].some((tag) => memory.value.toLowerCase().includes(tag) || tag.includes(memory.value.toLowerCase()))));
  return (matched.length ? matched : state.friends).slice(0, 3);
}

function themeFor(id: string) { return Math.abs([...id].reduce((total, letter) => total + letter.charCodeAt(0), 0)) % 8; }
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2); }
