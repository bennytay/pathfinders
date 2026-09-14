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

test("version 4 workspaces gain explicit reminder controls without losing records", () => {
  const migrated = migrateWorkspace({ schemaVersion: 4, friends: [{ id: "friend", displayName: "Sam", cadenceDays: 14, archived: false, createdAt: "2026-09-14T00:00:00.000Z" }], prompts: [{ id: "prompt", friendId: "friend", reason: "A reason", state: "active", generatedAt: "2026-09-14T00:00:00.000Z" }] });
  assert.equal(migrated.friends[0].promptEnabled, true);
  assert.equal(migrated.prompts[0].updatedAt, "2026-09-14T00:00:00.000Z");
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

test("deleting a friend cascades their notes, interactions, proposals, memories, prompts, and plans", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  const initial = repository.load();
  const maya = initial.friends.find((friend) => friend.id === "maya-chen")!;
  repository.approveProposal("maya-proposal");
  repository.createPlan({ friendId: maya.id, message: "Want to try pottery?" });
  const result = repository.deleteFriend(maya.id);
  assert.equal(result.friends.some((friend) => friend.id === maya.id), false);
  assert.equal(result.notes.length, 0);
  assert.equal(result.interactions.length, 0);
  assert.equal(result.factProposals.length, 0);
  assert.equal(result.memoryFacts.length, 0);
  assert.equal(result.planDrafts.length, 0);
});

test("a proposal must be grounded in the source note and approved memories preserve adapter metadata", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  assert.throws(() => repository.addFactProposal({ friendId: "maya-chen", sourceNoteId: "maya-pottery-reflection", type: "preference", value: "invented", sourceSpan: { start: 0, end: 8, text: "invented" }, confidence: 0.4, suggestedIntent: "remember", adapter: "fixture-extractor-v1" }), /source span/);
  const approved = repository.approveProposal("maya-proposal");
  assert.equal(approved.memoryFacts[0].adapter, "fixture-extractor-v1");
  assert.equal(approved.memoryFacts[0].sourceNoteId, "maya-pottery-reflection");
});

test("confirmed memories can be edited, merged with the same friend, and forgotten", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  repository.approveProposal("maya-proposal");
  const first = repository.load().memoryFacts[0];
  repository.addFactProposal({ friendId: "maya-chen", sourceNoteId: "maya-pottery-reflection", type: "preference", value: "making things", sourceSpan: { start: 40, end: 53, text: "making things" }, confidence: 0.5, suggestedIntent: "remember", adapter: "fixture-extractor-v1" });
  const secondProposal = repository.load().factProposals.find((proposal) => proposal.status === "pending")!;
  repository.approveProposal(secondProposal.id);
  const second = repository.load().memoryFacts.find((memory) => memory.id !== first.id)!;
  const countBeforeMerge = repository.load().memoryFacts.length;
  const merged = repository.mergeMemories(first.id, second.id);
  assert.equal(merged.memoryFacts.length, countBeforeMerge - 1);
  assert.ok(merged.memoryFacts[0].editHistory.includes("making things"));
  const edited = repository.editMemory(first.id, "making pottery");
  assert.equal(edited.memoryFacts[0].value, "making pottery");
  assert.equal(repository.forgetMemory(first.id).memoryFacts.length, countBeforeMerge - 2);
});
