import assert from "node:assert/strict";
import test from "node:test";
import { computeFeatureWeights, rankReel } from "@/lib/reel-ranking";
import type { MomentCandidate, PhotoStar } from "@/lib/workspace";

function candidate(overrides: Partial<MomentCandidate> & { id: string }): MomentCandidate {
  return {
    photo: { assetId: `${overrides.id}-asset`, label: "A moment", capturedAt: "2026-09-10T18:00:00.000Z", place: "The Park", retention: "not-stored", src: "/highlight.jpg" },
    candidateFriendIds: ["priya-shah"],
    analysisKind: "fixture",
    analysisLabel: "Synthetic",
    status: "confirmed",
    createdAt: "2026-09-10T18:00:00.000Z",
    updatedAt: "2026-09-10T18:00:00.000Z",
    ...overrides,
  };
}

test("a single star saves the photo without reshaping the whole reel (evidence floor)", () => {
  const candidates = [
    candidate({ id: "a", candidateFriendIds: ["priya-shah"] }),
    candidate({ id: "b", candidateFriendIds: ["hana-kim"] }),
  ];
  const stars: PhotoStar[] = [{ photoId: "a", starredAt: "2026-09-10T18:00:00.000Z" }];
  const { weights } = computeFeatureWeights(candidates, stars);
  assert.equal(weights.size, 0, "one starred photo alone should not create a feature preference");
});

test("weights only form once at least two starred photos share a feature, and un-starring reverses them", () => {
  const candidates = [
    candidate({ id: "a", candidateFriendIds: ["priya-shah"] }),
    candidate({ id: "b", candidateFriendIds: ["priya-shah"] }),
    candidate({ id: "c", candidateFriendIds: ["hana-kim"] }),
  ];
  const stars: PhotoStar[] = [
    { photoId: "a", starredAt: "2026-09-10T18:00:00.000Z" },
    { photoId: "b", starredAt: "2026-09-10T18:00:00.000Z" },
  ];
  const { weights } = computeFeatureWeights(candidates, stars);
  assert.ok(weights.get("companion:priya-shah")! > 0);
  const { weights: reverted } = computeFeatureWeights(candidates, []);
  assert.equal(reverted.size, 0, "removing all stars must fully reverse the learned profile");
});

test("confidence scales down with few stars so one new star cannot dominate the feed", () => {
  const candidates = Array.from({ length: 3 }, (_, index) => candidate({ id: `p${index}`, candidateFriendIds: ["priya-shah"] }));
  const stars: PhotoStar[] = [{ photoId: "p0", starredAt: "2026-09-10T18:00:00.000Z" }];
  const { confidence } = computeFeatureWeights(candidates, stars);
  assert.ok(confidence < 0.2, "confidence should be low with only one starred photo");
});

test("after several stars, the ranked reel favours the matching companion while still including others", () => {
  const priyaPhotos = ["p0", "p1", "p2", "p3"].map((id) => candidate({ id, candidateFriendIds: ["priya-shah"], photo: { assetId: `${id}-asset`, label: "Priya", capturedAt: "2026-09-10T18:00:00.000Z", place: "The Park", retention: "not-stored", src: "/highlight.jpg" } }));
  const hanaPhoto = candidate({ id: "h0", candidateFriendIds: ["hana-kim"], photo: { assetId: "h0-asset", label: "Hana", capturedAt: "2026-09-11T18:00:00.000Z", place: "The Cafe", retention: "not-stored", src: "/highlight.jpg" } });
  const candidates = [...priyaPhotos, hanaPhoto];
  const stars: PhotoStar[] = priyaPhotos.slice(0, 3).map((photo) => ({ photoId: photo.id, starredAt: "2026-09-10T18:00:00.000Z" }));
  const ranked = rankReel(candidates, stars, { asOf: new Date("2026-09-15T12:00:00.000Z") });
  assert.equal(ranked.length, candidates.length, "no photo should be dropped, only reordered");
  assert.ok(ranked.some((item) => item.candidate.candidateFriendIds.includes("hana-kim")), "unstarred content must still appear for variety");
  const topPriyaIndex = ranked.findIndex((item) => item.candidate.candidateFriendIds.includes("priya-shah"));
  const hanaIndex = ranked.findIndex((item) => item.candidate.candidateFriendIds.includes("hana-kim"));
  assert.ok(topPriyaIndex < hanaIndex, "starred-companion photos should rank above the unrelated one");
});

test("ranking and reasons are deterministic for identical inputs", () => {
  const candidates = [
    candidate({ id: "a" }),
    candidate({ id: "b", candidateFriendIds: ["hana-kim"], photo: { assetId: "b-asset", label: "Hana", capturedAt: "2026-09-11T09:00:00.000Z", place: "The Cafe", retention: "not-stored", src: "/highlight.jpg" } }),
  ];
  const stars: PhotoStar[] = [{ photoId: "a", starredAt: "2026-09-10T18:00:00.000Z" }];
  const asOf = new Date("2026-09-15T12:00:00.000Z");
  const first = rankReel(candidates, stars, { asOf });
  const second = rankReel(candidates, stars, { asOf });
  assert.deepEqual(first.map((item) => item.candidate.id), second.map((item) => item.candidate.id));
  assert.deepEqual(first.map((item) => item.reason), second.map((item) => item.reason));
});

test("a photo without a star and with no learned preference explains itself without inventing certainty", () => {
  const candidates = [candidate({ id: "a", candidateFriendIds: ["priya-shah"] })];
  const ranked = rankReel(candidates, [], { asOf: new Date("2026-09-10T18:00:00.000Z") });
  assert.equal(ranked[0].reason.type, "cold-start");
});

test("hidden (dismissed) photos are excluded from the reel", () => {
  const candidates = [candidate({ id: "a" }), candidate({ id: "b", status: "dismissed" })];
  const ranked = rankReel(candidates, []);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].candidate.id, "a");
});
