import assert from "node:assert/strict";
import test from "node:test";
import { BETA_ACTIVE_FRIEND_LIMIT, getFixtureWorkspace, validateFixtureWorkspace } from "@/lib/fixtures";
import { canAddActiveFriend, mayPersistAsMemory, mayUseRemoteProcessing } from "@/lib/product-boundaries";

test("the committed demo fixture is synthetic and contains no recordings", () => {
  const workspace = getFixtureWorkspace();
  assert.deepEqual(validateFixtureWorkspace(workspace), []);
  assert.ok(workspace.friends.length <= BETA_ACTIVE_FRIEND_LIMIT);
});
test("fixture reads are isolated from mutation", () => { const first = getFixtureWorkspace(); first.friends[0].displayName = "Changed locally"; assert.equal(getFixtureWorkspace().friends[0].displayName, "Maya Chen"); });
test("product boundaries prevent capacity overflow and unreviewed memory", () => { assert.equal(canAddActiveFriend(4), true); assert.equal(canAddActiveFriend(5), false); assert.equal(mayPersistAsMemory({ reviewedByUser: false, sourceNoteId: "note-1" }), false); assert.equal(mayPersistAsMemory({ reviewedByUser: true, sourceNoteId: "note-1" }), true); });
test("remote processing requires explicit recorded consent and a destination", () => { assert.equal(mayUseRemoteProcessing({ choice: "on-device" }), false); assert.equal(mayUseRemoteProcessing({ choice: "remote-opt-in", destination: "Example processor" }), false); assert.equal(mayUseRemoteProcessing({ choice: "remote-opt-in", destination: "Example processor", consentRecordedAt: "2026-09-14T00:00:00.000Z" }), true); });
