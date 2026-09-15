"use client";

const photos = [
  ["Saturday in Newtown", "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85"],
  ["Late dinner", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85"],
  ["Beach walk", "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=85"],
  ["Friday night", "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=85"],
  ["Open studio", "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85"],
  ["Afternoon outside", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85"],
] as const;

export function PhotoGallery({ onSelect }: { onSelect: () => void }) {
  return <section className="photo-gallery" aria-label="Recent hangout photos"><header><p>Recent hangouts</p><button type="button" aria-label="Add photos">+</button></header><div className="photo-stack">{photos.map(([label, src], index) => <button className={`hangout-photo photo-${index + 1}`} key={label} onClick={onSelect} style={{ backgroundImage: `url(${src})` }}><span>{label}</span></button>)}</div><p className="gallery-hint">Pick a photo to add the people who were there.</p></section>;
}
