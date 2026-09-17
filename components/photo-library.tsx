"use client";

import { useEffect, useMemo, useState } from "react";
import { rankReel, type ReelReason } from "@/lib/reel-ranking";
import type { WorkspaceState } from "@/lib/workspace";

const CYCLE_MS = 7000;
const displayDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));

function explainReason(reason: ReelReason, friendName: (id: string) => string): string {
  if (reason.type === "cold-start") return "A recent memory, shown for variety.";
  if (reason.type === "exploration") return "A change of pace from what you usually star.";
  if (reason.type === "nostalgia") return "From around this time, a previous year.";
  const top = [...reason.contributors].sort((a, b) => b.weight - a.weight).slice(0, 2);
  const parts = top.map((contributor) => {
    if (contributor.kind === "companion") return `photos with ${friendName(contributor.value)}`;
    if (contributor.kind === "place") return `photos at ${contributor.value}`;
    if (contributor.kind === "time") return `${contributor.value} photos`;
    return `${contributor.value} photos`;
  });
  return `You starred several ${parts.join(" and ")}.`;
}

export function PhotoLibrary({ state, friendName, onScan, onStar }: { state: WorkspaceState; friendName: (id: string) => string; onScan: () => void; onStar: (photoId: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [index, setIndex] = useState(0);
  const [reasonOpenForIndex, setReasonOpenForIndex] = useState<number | null>(null);
  const [asOf] = useState(() => new Date());

  const ranked = useMemo(() => rankReel(state.momentCandidates, state.photoStars, { asOf }), [state.momentCandidates, state.photoStars, asOf]);
  const current = ranked.length ? ranked[index % ranked.length] : null;
  const isStarred = current ? state.photoStars.some((star) => star.photoId === current.candidate.id) : false;
  const showReason = reasonOpenForIndex === index;

  useEffect(() => {
    if (ranked.length < 2) return;
    const timer = setInterval(() => setIndex((value) => value + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [ranked.length]);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      onScan();
      setScanning(false);
    }, 900);
  };

  if (scanning) {
    return (
      <section className="library-scan" aria-live="polite">
        <div className="scan-orbit" aria-hidden="true"><span /><span /></div>
        <p className="detected-label"><span className="scan-dot" aria-hidden="true" />Scanning your photos</p>
        <h2>Looking for moments with your circle…</h2>
      </section>
    );
  }

  if (!state.photoLibrary.granted) {
    return (
      <section className="moment-candidate photo-gate" aria-labelledby="scan-heading">
        <div className="setup-orb" aria-hidden="true" />
        <p className="eyebrow">Photo-native</p>
        <h2 id="scan-heading">Let Circle learn your circle.</h2>
        <p>Circle scans the photos on this device for the friends you&rsquo;ve already added, matching against the reference photo already on each profile. It never uploads a photo.</p>
        <button className="primary" onClick={startScan}>Scan my photos</button>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="moment-candidate" aria-live="polite">
        <p className="eyebrow">All caught up</p>
        <h2>No new moments right now.</h2>
        <p>Circle will keep looking as new photos are added. Check again anytime.</p>
        <button className="secondary" onClick={startScan}>Scan again</button>
      </section>
    );
  }

  const { candidate, reason } = current;

  return (
    <section className="highlight-reel" aria-label="Highlights">
      <div
        className="highlight-frame"
        style={candidate.photo.src ? { backgroundImage: `url(${candidate.photo.src})` } : undefined}
        onClick={() => ranked.length > 1 && setIndex((value) => value + 1)}
      >
        {ranked.length > 1 && (
          <div className="highlight-dots" aria-hidden="true">
            {ranked.map((item, dotIndex) => <span key={item.candidate.id} className={dotIndex === index % ranked.length ? "active" : undefined} />)}
          </div>
        )}
        <button
          type="button"
          className="highlight-rescan"
          aria-label="Scan for new photos"
          onClick={(event) => {
            event.stopPropagation();
            startScan();
          }}
        >
          <RefreshIcon />
        </button>
        <div className="highlight-caption">
          <p className="highlight-quote">{candidate.photo.caption ?? candidate.photo.label}</p>
          <p className="highlight-meta">{candidate.candidateFriendIds.map(friendName).join(" and ")}{candidate.photo.place ? ` · ${candidate.photo.place}` : ""}{candidate.photo.capturedAt ? ` · ${displayDate(candidate.photo.capturedAt)}` : ""}</p>
          <div className="highlight-actions">
            <button
              type="button"
              className={isStarred ? "star-button starred" : "star-button"}
              aria-pressed={isStarred}
              onClick={(event) => {
                event.stopPropagation();
                onStar(candidate.id);
              }}
            >
              <StarIcon filled={isStarred} />
              {isStarred ? "Saved" : "Save this feeling"}
            </button>
            <button
              type="button"
              className="reel-why-button"
              aria-expanded={showReason}
              onClick={(event) => {
                event.stopPropagation();
                setReasonOpenForIndex((value) => (value === index ? null : index));
              }}
            >
              Why this photo?
            </button>
          </div>
          {showReason && <p className="reel-reason" role="status">{explainReason(reason, friendName)}</p>}
        </div>
      </div>
    </section>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16M3 21v-5h5" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
    </svg>
  );
}
