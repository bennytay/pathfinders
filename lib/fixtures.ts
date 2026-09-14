import { BETA_ACTIVE_FRIEND_LIMIT, type WorkspaceState } from "@/lib/workspace";

export { BETA_ACTIVE_FRIEND_LIMIT };

export function getFixtureWorkspace(): WorkspaceState {
  return {
    schemaVersion: 4, fixtureMode: true, city: "Sydney", circle: { id: "circle-fixture", name: "Close circle", maxMembers: BETA_ACTIVE_FRIEND_LIMIT },
    friends: [{ id: "maya-chen", displayName: "Maya Chen", cadenceDays: 14, archived: false, createdAt: "2026-08-01T00:00:00.000Z" }, { id: "jordan-lee", displayName: "Jordan Lee", cadenceDays: 14, archived: false, createdAt: "2026-08-01T00:00:00.000Z" }, { id: "eli-park", displayName: "Eli Park", cadenceDays: 21, archived: false, createdAt: "2026-08-01T00:00:00.000Z" }],
    notes: [{ id: "maya-pottery-reflection", text: "Synthetic example: Maya mentioned missing making things after a busy week. A pottery class could be a nice plan.", friendIds: ["maya-chen"], capturedAt: "2026-09-14T08:30:00.000Z", state: "saved", transcriptionMode: "manual-text" }],
    interactions: [{ id: "maya-last-meetup", friendId: "maya-chen", kind: "in-person", occurredAt: "2026-08-21T18:00:00.000Z", note: "Synthetic fixture" }],
    factProposals: [{ id: "maya-proposal", friendId: "maya-chen", sourceNoteId: "maya-pottery-reflection", type: "shared-interest", value: "making things", sourceSpan: { start: 42, end: 55, text: "making things" }, confidence: 0.88, suggestedIntent: "plan", adapter: "fixture-extractor-v1", status: "pending", createdAt: "2026-09-14T08:30:00.000Z" }],
    memoryFacts: [], activities: [{ id: "pottery-night", title: "Pottery night", details: "A manual idea, not an event-provider result.", source: "fixture", retrievedAt: "2026-09-14T08:30:00.000Z", tags: ["making"] }], prompts: [], planDrafts: [],
    privacySettings: { audioRetention: "transcript-only", telemetryOptIn: false, remoteProcessingDefault: "ask-every-note", updatedAt: "2026-09-14T08:30:00.000Z" }, migrationHistory: [{ version: 1, migratedAt: "2026-09-14T08:30:00.000Z" }, { version: 2, migratedAt: "2026-09-14T08:30:00.000Z" }, { version: 3, migratedAt: "2026-09-14T08:30:00.000Z" }, { version: 4, migratedAt: "2026-09-14T08:30:00.000Z" }],
  };
}

export function getFailureFixture(): WorkspaceState { const state = getFixtureWorkspace(); return { ...state, friends: Array.from({ length: BETA_ACTIVE_FRIEND_LIMIT }, (_, index) => ({ id: `fixture-${index}`, displayName: `Fixture friend ${index + 1}`, cadenceDays: 14, archived: false, createdAt: "2026-09-14T08:30:00.000Z" })), notes: [], interactions: [], factProposals: [] }; }
export function validateFixtureWorkspace(workspace: WorkspaceState): string[] { const issues: string[] = []; if (!workspace.fixtureMode) issues.push("Fixture workspaces must be marked synthetic."); if (workspace.friends.length > BETA_ACTIVE_FRIEND_LIMIT) issues.push(`Fixture exceeds the beta limit of ${BETA_ACTIVE_FRIEND_LIMIT} active friends.`); if (workspace.notes.some((note) => !note.text.includes("Synthetic"))) issues.push("Fixtures must make synthetic notes obvious."); return issues; }
