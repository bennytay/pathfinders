import type { MomentCandidate, PhotoAnalysisKind } from "@/lib/workspace";

export type PhotoAnalysisCapability = {
  kind: PhotoAnalysisKind;
  label: string;
  privacyDescription: string;
  available: boolean;
};

export type PhotoAnalysisAdapter = {
  readonly capability: PhotoAnalysisCapability;
  analyze(): Omit<MomentCandidate, "id" | "status" | "createdAt" | "updatedAt">;
};

export const fixturePhotoAnalysisAdapter: PhotoAnalysisAdapter = {
  capability: {
    kind: "fixture",
    label: "Synthetic demo detection",
    privacyDescription: "This resettable example uses synthetic results. Circle has not accessed a camera roll, uploaded a photo, or recognised a face.",
    available: true,
  },
  analyze: () => ({
    photo: { assetId: "fixture-saturday-newtown", label: "Saturday afternoon in Newtown", capturedAt: "2026-09-12T15:30:00.000Z", place: "Newtown", retention: "not-stored" },
    candidateFriendIds: ["maya-chen", "ari-singh"],
    analysisKind: "fixture",
    analysisLabel: "Synthetic demo detection",
  }),
};

export const unavailablePhotoAnalysisCapability: PhotoAnalysisCapability = {
  kind: "user-selection",
  label: "Photo moments are not enabled yet",
  privacyDescription: "Circle has not asked for access to your photo library and cannot recognise anyone from your photos.",
  available: false,
};
