import { fixturePhotoAnalysisAdapter } from "@/lib/photo-analysis";
import { BETA_ACTIVE_FRIEND_LIMIT, CURRENT_SCHEMA_VERSION, type WorkspaceState } from "@/lib/workspace";

export { BETA_ACTIVE_FRIEND_LIMIT };

const fixtureNote = "Synthetic example: Maya said she wants to try bouldering next week and just started her internship.";

export function getFixtureWorkspace(): WorkspaceState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION, fixtureMode: true, city: "Sydney", circle: { id: "circle-fixture", name: "Circle", maxMembers: BETA_ACTIVE_FRIEND_LIMIT },
    friends: [
      { id: "maya-chen", displayName: "Maya Chen", cadenceDays: 14, promptEnabled: true, archived: false, createdAt: "2026-08-01T00:00:00.000Z" },
      { id: "ari-singh", displayName: "Ari Singh", cadenceDays: 14, promptEnabled: true, archived: false, createdAt: "2026-08-01T00:00:00.000Z" },
    ],
    notes: [{ id: "maya-bouldering-reflection", text: fixtureNote, friendIds: ["maya-chen"], capturedAt: "2026-08-21T08:30:00.000Z", state: "saved", transcriptionMode: "manual-text" }],
    interactions: [{ id: "maya-last-meetup", friendId: "maya-chen", kind: "in-person", occurredAt: "2026-08-21T18:00:00.000Z", note: "Synthetic fixture" }, { id: "ari-last-meetup", friendId: "ari-singh", kind: "in-person", occurredAt: "2026-08-21T18:00:00.000Z", note: "Synthetic fixture" }],
    momentCandidates: [],
    confirmedHangouts: [],
    factProposals: [
      { id: "maya-bouldering-proposal", friendId: "maya-chen", sourceNoteId: "maya-bouldering-reflection", type: "intention", value: "try bouldering next week", sourceSpan: { start: 42, end: 66, text: "try bouldering next week" }, confidence: 0.88, suggestedIntent: "plan", adapter: "fixture-extractor-v1", status: "approved", createdAt: "2026-08-21T08:30:00.000Z" },
      { id: "maya-internship-proposal", friendId: "maya-chen", sourceNoteId: "maya-bouldering-reflection", type: "preference", value: "started her internship", sourceSpan: { start: 76, end: 98, text: "started her internship" }, confidence: 0.72, suggestedIntent: "remember", adapter: "fixture-extractor-v1", status: "pending", createdAt: "2026-08-21T08:30:00.000Z" },
    ],
    memoryFacts: [{ id: "maya-bouldering-memory", friendId: "maya-chen", sourceNoteId: "maya-bouldering-reflection", proposalId: "maya-bouldering-proposal", type: "intention", value: "try bouldering next week", approvedAt: "2026-08-21T08:40:00.000Z", adapter: "fixture-extractor-v1", confidence: 0.88, editHistory: [] }],
    activities: [{ id: "beginner-bouldering", title: "Beginner bouldering", details: "A manual idea, not an event-provider result.", location: "Near campus", source: "fixture", retrievedAt: "2026-09-14T08:30:00.000Z", tags: ["bouldering", "beginner", "climbing"] }],
    prompts: [], planDrafts: [],
    privacySettings: { audioRetention: "transcript-only", telemetryOptIn: false, remoteProcessingDefault: "ask-every-note", updatedAt: "2026-09-14T08:30:00.000Z" }, migrationHistory: [{ version: CURRENT_SCHEMA_VERSION, migratedAt: "2026-09-14T08:30:00.000Z" }],
  };
}

export function getFixtureMomentCandidate() { return fixturePhotoAnalysisAdapter.analyze(); }

export function getFailureFixture(): WorkspaceState { const state = getFixtureWorkspace(); return { ...state, friends: Array.from({ length: BETA_ACTIVE_FRIEND_LIMIT }, (_, index) => ({ id: `fixture-${index}`, displayName: `Fixture friend ${index + 1}`, cadenceDays: 14, promptEnabled: true, archived: false, createdAt: "2026-09-14T08:30:00.000Z" })), notes: [], interactions: [], momentCandidates: [], confirmedHangouts: [], factProposals: [], memoryFacts: [] }; }
export function validateFixtureWorkspace(workspace: WorkspaceState): string[] { const issues: string[] = []; if (!workspace.fixtureMode) issues.push("Fixture workspaces must be marked synthetic."); if (workspace.friends.length > BETA_ACTIVE_FRIEND_LIMIT) issues.push(`Fixture exceeds the beta limit of ${BETA_ACTIVE_FRIEND_LIMIT} active friends.`); if (workspace.notes.some((note) => !note.text.includes("Synthetic"))) issues.push("Fixtures must make synthetic notes obvious."); if (workspace.momentCandidates.some((moment) => moment.analysisKind !== "fixture")) issues.push("Fixture moments must identify their synthetic analysis source."); return issues; }
