import { BETA_ACTIVE_FRIEND_LIMIT } from "@/lib/fixtures";

export type ProcessingChoice = "on-device" | "remote-opt-in";

export function canAddActiveFriend(activeFriendCount: number): boolean {
  return Number.isInteger(activeFriendCount) && activeFriendCount >= 0 && activeFriendCount < BETA_ACTIVE_FRIEND_LIMIT;
}

export function mayPersistAsMemory(input: { reviewedByUser: boolean; sourceNoteId?: string }): boolean {
  return input.reviewedByUser && typeof input.sourceNoteId === "string" && input.sourceNoteId.length > 0;
}

export function mayUseRemoteProcessing(input: { choice: ProcessingChoice; consentRecordedAt?: string; destination?: string }): boolean {
  return input.choice === "remote-opt-in" && Boolean(input.consentRecordedAt) && Boolean(input.destination);
}
