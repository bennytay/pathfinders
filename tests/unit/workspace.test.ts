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
