import type { PhotoAnalysisKind } from "@/lib/workspace";

export type PhotoAnalysisCapability = {
  kind: PhotoAnalysisKind;
  label: string;
  privacyDescription: string;
  available: boolean;
};

export const notGrantedPhotoLibraryCapability: PhotoAnalysisCapability = {
  kind: "user-selection",
  label: "Photo library scan is not enabled yet",
  privacyDescription: "Circle has not been given access to your photo library and cannot recognise anyone from your photos.",
  available: false,
};

export const fixturePhotoLibraryCapability: PhotoAnalysisCapability = {
  kind: "fixture",
  label: "Synthetic photo-library scan",
  privacyDescription: "This resettable demo simulates scanning a photo library on this device, matching photos against the reference photo already on each friend's profile. No real photo library is accessed and nothing leaves this device.",
  available: true,
};
