"use client";

import { useRef, useState, type PointerEvent } from "react";

const photos = [
  { label: "Saturday in Newtown", context: "Maya and Ari finally tried the beginner wall, then debriefed over dumplings. The kind of unhurried afternoon worth remembering.", src: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85" },
  { label: "Late dinner", context: "A long table, a shared bottle of something good, and everyone stayed past the point they meant to leave.", src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85" },
  { label: "Beach walk", context: "A quiet reset by the water. Jess brought coffee, Ari brought the playlist, and no one rushed home.", src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85" },
  { label: "Friday night", context: "Live music with the whole crew. This was the night Noah found his new favourite band.", src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=85" },
  { label: "Open studio", context: "Clay on everyone’s hands and a surprisingly competitive debate about which cup was best.", src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=85" },
  { label: "Afternoon outside", context: "One of those accidental good days: sun, snacks, and a plan that kept changing for the better.", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85" },
] as const;

const VISIBLE_RADIUS = 2;
const CARD_SPACING = 108;

function mod(value: number, size: number) {
  return ((value % size) + size) % size;
}

export function PhotoGallery({ onSelect }: { onSelect: () => void }) {
  const [offset, setOffset] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<(typeof photos)[number] | null>(null);
  const pointerActive = useRef(false);
  const startX = useRef(0);
  const dragPxRef = useRef(0);
  const moved = useRef(false);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    (event.target as Element).setPointerCapture(event.pointerId);
    pointerActive.current = true;
    startX.current = event.clientX;
    moved.current = false;
    setIsDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointerActive.current) return;
    const delta = event.clientX - startX.current;
    if (Math.abs(delta) > 4) moved.current = true;
    dragPxRef.current = delta;
    setDragPx(delta);
  }

  function endDrag() {
    if (!pointerActive.current) return;
    pointerActive.current = false;
    const steps = Math.round(dragPxRef.current / CARD_SPACING);
    if (steps !== 0) setOffset((value) => value - steps);
    dragPxRef.current = 0;
    setDragPx(0);
    setIsDragging(false);
  }

  const length = photos.length;
  const offsets = Array.from({ length: VISIBLE_RADIUS * 2 + 1 }, (_, index) => index - VISIBLE_RADIUS);
  const cards = offsets.map((relative) => {
    const photo = photos[mod(offset + relative, length)];
    const distance = Math.abs(relative);
    const translateX = relative * CARD_SPACING + (isDragging ? dragPx : 0);
    const rotate = relative === 0 ? 0 : Math.min(distance * 26, 62) * (relative > 0 ? -1 : 1);
    const scale = Math.max(1 - distance * 0.16, 0.62);
    const translateZ = -distance * 70;
    const opacity = Math.max(1 - distance * 0.28, 0);
    return (
      <button
        type="button"
        key={`${relative}-${photo.label}`}
        className={relative === 0 ? "carousel-card is-center" : "carousel-card"}
        aria-label={photo.label}
        style={{
          backgroundImage: `url(${photo.src})`,
          transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotate}deg) scale(${scale})`,
          transformOrigin: relative === 0 ? "center center" : relative > 0 ? "left center" : "right center",
          zIndex: 10 - distance,
          opacity,
          transition: isDragging ? "none" : "transform 420ms cubic-bezier(.16, 1, .3, 1), opacity 420ms ease",
        }}
        onClick={() => {
          if (moved.current) return;
          if (relative === 0) {
            setSelected(photo);
            return;
          }
          setOffset((value) => value + relative);
        }}
      >
        {relative === 0 && <span>{photo.label}</span>}
      </button>
    );
  });

  return (
    <section className="photo-gallery" aria-label="Hangouts">
      <header>
        <div><p>Hangouts</p><small>Small evidence of a good life.</small></div>
        <button type="button" aria-label="Add photos" onClick={() => document.getElementById("photo-upload")?.click()}>+</button>
        <input id="photo-upload" className="sr-only" type="file" accept="image/*" multiple onChange={() => onSelect()} />
      </header>
      <div
        className="hangout-carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {cards}
      </div>
      <p className="gallery-hint">Swipe to browse. Tap the centre photo to revisit the moment.</p>
      {selected && <section className="hangout-detail" aria-label={`${selected.label} details`}><button className="detail-close" onClick={() => setSelected(null)} aria-label="Close hangout">×</button><div className="detail-image" style={{ backgroundImage: `url(${selected.src})` }} /><div className="detail-copy"><p className="eyebrow">A little context</p><h2>{selected.label}</h2><p>{selected.context}</p><button className="primary" onClick={onSelect}>Keep this as a moment</button></div></section>}
    </section>
  );
}
