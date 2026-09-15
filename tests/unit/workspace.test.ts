import assert from "node:assert/strict";
import test from "node:test";
import { getFailureFixture, getFixtureWorkspace } from "@/lib/fixtures";
import { BETA_ACTIVE_FRIEND_LIMIT, CURRENT_SCHEMA_VERSION, LocalWorkspaceRepository, migrateWorkspace, type StorageLike } from "@/lib/workspace";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("local repository seeds, exports, and resets a versioned workspace", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  assert.equal(repository.load().schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.match(repository.export(), /maya-chen/);
  assert.equal(repository.reset().circle, null);
});

test("a legacy version 0 record migrates through the versioned boundary", () => {
  const migrated = migrateWorkspace({ schemaVersion: 0, city: "Sydney", friends: [] });
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.city, "Sydney");
  assert.ok(migrated.migrationHistory.some((migration) => migration.version === CURRENT_SCHEMA_VERSION));
});

test("version 1 notes migrate to the explicit manual-transcript processing mode", () => {
  const migrated = migrateWorkspace({ schemaVersion: 1, notes: [{ id: "legacy-note", text: "Hello", friendIds: [], capturedAt: "2026-09-14T00:00:00.000Z", state: "saved" }] });
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.notes[0].transcriptionMode, "manual-text");
});

test("version 4 workspaces gain later reminder and moment boundaries without losing records", () => {
  const migrated = migrateWorkspace({ schemaVersion: 4, friends: [{ id: "friend", displayName: "Sam", cadenceDays: 14, archived: false, createdAt: "2026-09-14T00:00:00.000Z" }], prompts: [{ id: "prompt", friendId: "friend", reason: "A reason", state: "active", generatedAt: "2026-09-14T00:00:00.000Z" }] });
  assert.equal(migrated.friends[0].promptEnabled, true);
  assert.equal(migrated.prompts[0].updatedAt, "2026-09-14T00:00:00.000Z");
  assert.deepEqual(migrated.momentCandidates, []);
  assert.deepEqual(migrated.confirmedHangouts, []);
});

test("a local circle enforces its active-friend capacity", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.createCircle({ name: "Close circle", city: "Sydney" });
  for (let index = 0; index < BETA_ACTIVE_FRIEND_LIMIT; index += 1) repository.addFriend({ displayName: `Friend ${index}`, cadenceDays: 14 });
  assert.throws(() => repository.addFriend({ displayName: "One too many", cadenceDays: 14 }), /up to 5 active friends/);
});

test("the failure fixture reproduces the full-circle state without personal data", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFailureFixture());
  assert.equal(repository.load().friends.length, BETA_ACTIVE_FRIEND_LIMIT);
  assert.throws(() => repository.addFriend({ displayName: "Blocked fixture friend", cadenceDays: 14 }), /up to 5 active friends/);
});

test("deleting a friend cascades their notes, interactions, moments, proposals, memories, prompts, and plans", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  const initial = repository.load();
  const maya = initial.friends.find((friend) => friend.id === "maya-chen")!;
  repository.approveProposal("maya-internship-proposal");
  repository.createPlan({ friendId: maya.id, message: "Want to try pottery?" });
  const result = repository.deleteFriend(maya.id);
  assert.equal(result.friends.some((friend) => friend.id === maya.id), false);
  assert.equal(result.notes.length, 0);
  assert.equal(result.interactions.length, 1);
  assert.equal(result.momentCandidates.length, 0);
  assert.equal(result.confirmedHangouts.length, 0);
  assert.equal(result.factProposals.length, 0);
  assert.equal(result.memoryFacts.length, 0);
  assert.equal(result.planDrafts.length, 0);
});

test("a proposal must be grounded in the source note and approved memories preserve adapter metadata", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  assert.throws(() => repository.addFactProposal({ friendId: "maya-chen", sourceNoteId: "maya-bouldering-reflection", type: "preference", value: "invented", sourceSpan: { start: 0, end: 8, text: "invented" }, confidence: 0.4, suggestedIntent: "remember", adapter: "fixture-extractor-v1" }), /source span/);
  const approved = repository.approveProposal("maya-internship-proposal");
  assert.equal(approved.memoryFacts[0].adapter, "fixture-extractor-v1");
  assert.equal(approved.memoryFacts[0].sourceNoteId, "maya-bouldering-reflection");
});

test("confirmed memories can be edited, merged with the same friend, and forgotten", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  const first = repository.load().memoryFacts[0];
  repository.approveProposal("maya-internship-proposal");
  const second = repository.load().memoryFacts.find((memory) => memory.id !== first.id)!;
  const countBeforeMerge = repository.load().memoryFacts.length;
  const merged = repository.mergeMemories(first.id, second.id);
  assert.equal(merged.memoryFacts.length, countBeforeMerge - 1);
  assert.ok(merged.memoryFacts[0].editHistory.includes("started her internship"));
  const edited = repository.editMemory(first.id, "try bouldering together");
  assert.equal(edited.memoryFacts[0].value, "try bouldering together");
  assert.equal(repository.forgetMemory(first.id).memoryFacts.length, countBeforeMerge - 2);
});

test("a photo-derived moment is reviewable before it becomes a separately stored hangout", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  const candidate = repository.createMomentCandidate({ photo: { assetId: "synthetic-photo", label: "Saturday in Newtown", capturedAt: "2026-09-12T15:30:00.000Z", place: "Newtown", retention: "not-stored" }, candidateFriendIds: ["maya-chen", "ari-singh"], analysisKind: "fixture", analysisLabel: "Synthetic demo detection" });
  assert.equal(candidate.momentCandidates[0].status, "pending");
  assert.equal(candidate.confirmedHangouts.length, 0);
  const confirmed = repository.confirmMomentCandidate(candidate.momentCandidates[0].id);
  assert.equal(confirmed.momentCandidates[0].status, "confirmed");
  assert.deepEqual(confirmed.confirmedHangouts[0].friendIds, ["maya-chen", "ari-singh"]);
  assert.equal(confirmed.interactions.length, 2);
});
