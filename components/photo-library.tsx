"use client";

import { useEffect, useState } from "react";
import type { WorkspaceState } from "@/lib/workspace";

const CYCLE_MS = 7000;
const displayDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));

export function PhotoLibrary({ state, friendName, onScan }: { state: WorkspaceState; friendName: (id: string) => string; onScan: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [index, setIndex] = useState(0);

  const highlights = state.momentCandidates.filter((candidate) => candidate.photo.src);
  const current = highlights.length ? highlights[index % highlights.length] : null;

  useEffect(() => {
    if (highlights.length < 2) return;
    const timer = setInterval(() => setIndex((value) => value + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [highlights.length]);

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

  return (
    <section className="highlight-reel" aria-label="Highlights">
      <div
        className="highlight-frame"
        style={current.photo.src ? { backgroundImage: `url(${current.photo.src})` } : undefined}
        onClick={() => highlights.length > 1 && setIndex((value) => value + 1)}
      >
        {highlights.length > 1 && (
          <div className="highlight-dots" aria-hidden="true">
            {highlights.map((candidate, dotIndex) => <span key={candidate.id} className={dotIndex === index % highlights.length ? "active" : undefined} />)}
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
          <p className="highlight-quote">{current.photo.caption ?? current.photo.label}</p>
          <p className="highlight-meta">{current.candidateFriendIds.map(friendName).join(" and ")}{current.photo.place ? ` · ${current.photo.place}` : ""}{current.photo.capturedAt ? ` · ${displayDate(current.photo.capturedAt)}` : ""}</p>
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
