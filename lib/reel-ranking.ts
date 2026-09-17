import type { MomentCandidate, PhotoStar } from "@/lib/workspace";

export type FeatureKind = "companion" | "place" | "time" | "day";
export type Feature = { key: string; kind: FeatureKind; value: string };

export type ReelReason =
  | { type: "cold-start" }
  | { type: "exploration" }
  | { type: "nostalgia" }
  | { type: "preference"; contributors: Array<{ kind: FeatureKind; value: string; weight: number }> };

export type RankedPhoto = { candidate: MomentCandidate; score: number; reason: ReelReason };

function timeBucket(hour: number): string {
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// Only non-sensitive, local, user-correctable signals: confirmed companions,
// coarse place, and capture-time buckets. No face embeddings or inferred attributes.
export function featuresFor(candidate: MomentCandidate): Feature[] {
  const features: Feature[] = candidate.candidateFriendIds.map((friendId) => ({ key: `companion:${friendId}`, kind: "companion" as const, value: friendId }));
  if (candidate.photo.place) features.push({ key: `place:${candidate.photo.place}`, kind: "place", value: candidate.photo.place });
  if (candidate.photo.capturedAt) {
    const date = new Date(candidate.photo.capturedAt);
    const bucket = timeBucket(date.getUTCHours());
    features.push({ key: `time:${bucket}`, kind: "time", value: bucket });
    const day = date.getUTCDay();
    const dayValue = day === 0 || day === 6 ? "weekend" : "weekday";
    features.push({ key: `day:${dayValue}`, kind: "day", value: dayValue });
  }
  return features;
}

// weight(f) = log(1 + starredPhotosContaining(f)) / log(1 + totalStarredPhotos)
// A feature only enters the profile once at least two starred photos share it,
// so a single one-off star saves that photo without reshaping the whole reel.
export function computeFeatureWeights(candidates: MomentCandidate[], stars: PhotoStar[]): { weights: Map<string, number>; confidence: number } {
  const starredIds = new Set(stars.map((star) => star.photoId));
  const starredCandidates = candidates.filter((candidate) => starredIds.has(candidate.id));
  const totalStarred = starredCandidates.length;
  const counts = new Map<string, number>();
  for (const candidate of starredCandidates) {
    for (const feature of featuresFor(candidate)) counts.set(feature.key, (counts.get(feature.key) ?? 0) + 1);
  }
  const weights = new Map<string, number>();
  if (totalStarred > 0) {
    for (const [key, count] of counts) {
      if (count < 2) continue;
      weights.set(key, Math.log(1 + count) / Math.log(1 + totalStarred));
    }
  }
  // confidence = min(1, totalStarredPhotos / 8) — avoids overfitting the whole reel to one new star.
  const confidence = Math.min(1, totalStarred / 8);
  return { weights, confidence };
}

function dayOfYear(date: Date): number {
  return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86_400_000);
}

// Gently surfaces "around this week, a previous year" without overwhelming starred preferences.
function nostalgiaFit(candidate: MomentCandidate, asOf: Date): number {
  if (!candidate.photo.capturedAt) return 0;
  const captured = new Date(candidate.photo.capturedAt);
  if (captured.getTime() > asOf.getTime()) return 0;
  if (asOf.getUTCFullYear() === captured.getUTCFullYear()) return 0;
  return Math.abs(dayOfYear(asOf) - dayOfYear(captured)) <= 10 ? 1 : 0;
}

// A stable hash, not Math.random, so the same photo always lands in the same
// exploration slot for a given session — deterministic, not gambling.
function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

// Reserve roughly one in eight positions for a photo that isn't strongly predicted by the profile.
// Keyed on the stable photo asset, not the record id, which is a fresh random
// UUID on every scan — hashing that would make ordering look random per reload.
function isExplorationSlot(candidate: MomentCandidate): boolean {
  return hashString(candidate.photo.assetId) % 8 === 0;
}

export function scoreCandidate(candidate: MomentCandidate, weights: Map<string, number>, confidence: number, asOf: Date) {
  const features = featuresFor(candidate);
  const contributors = features.map((feature) => ({ feature, weight: weights.get(feature.key) ?? 0 })).filter((item) => item.weight > 0);
  const preferenceMatch = features.length ? contributors.reduce((sum, item) => sum + item.weight, 0) / features.length : 0;
  const photoQuality = candidate.photo.src ? 1 : 0;
  const exploration = isExplorationSlot(candidate) ? 1 : 0;
  const score = 0.55 * confidence * preferenceMatch + 0.2 * nostalgiaFit(candidate, asOf) + 0.15 * photoQuality + 0.1 * exploration;
  return { score, contributors };
}

function reasonFor(candidate: MomentCandidate, contributors: Array<{ feature: Feature; weight: number }>, asOf: Date): ReelReason {
  if (contributors.length) return { type: "preference", contributors: contributors.map(({ feature, weight }) => ({ kind: feature.kind, value: feature.value, weight })) };
  if (nostalgiaFit(candidate, asOf) > 0) return { type: "nostalgia" };
  if (isExplorationSlot(candidate)) return { type: "exploration" };
  return { type: "cold-start" };
}

// Deterministic: identical candidates + stars + asOf always produce the same order and reasons.
// Diversity pass avoids showing the same place back-to-back when an alternative exists.
export function rankReel(candidates: MomentCandidate[], stars: PhotoStar[], options?: { asOf?: Date }): RankedPhoto[] {
  const asOf = options?.asOf ?? new Date();
  const eligible = candidates.filter((candidate) => candidate.photo.src && candidate.status !== "dismissed");
  const { weights, confidence } = computeFeatureWeights(eligible, stars);
  const scored: RankedPhoto[] = eligible
    .map((candidate) => {
      const { score, contributors } = scoreCandidate(candidate, weights, confidence, asOf);
      return { candidate, score, reason: reasonFor(candidate, contributors, asOf) };
    })
    .sort((a, b) => b.score - a.score || a.candidate.photo.assetId.localeCompare(b.candidate.photo.assetId));

  const remaining = [...scored];
  const ordered: RankedPhoto[] = [];
  while (remaining.length) {
    const previousPlace = ordered[ordered.length - 1]?.candidate.photo.place;
    const index = remaining.findIndex((item) => !previousPlace || item.candidate.photo.place !== previousPlace);
    const [next] = remaining.splice(index === -1 ? 0 : index, 1);
    ordered.push(next);
  }
  return ordered;
}
