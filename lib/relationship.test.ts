import assert from "node:assert/strict";
import test from "node:test";
import { defaultStayInTouchDays, relationshipSnapshot } from "./relationship";

test("uses the relationship cadence defaults", () => {
  assert.equal(defaultStayInTouchDays(1), 90);
  assert.equal(defaultStayInTouchDays(3), 45);
  assert.equal(defaultStayInTouchDays(4), 21);
});

test("marks a friend overdue only after their cadence", () => {
  const now = new Date("2026-09-11T12:00:00Z");
  const snapshot = relationshipSnapshot({
    lastContactedAt: new Date("2026-08-20T12:00:00Z"),
    lastSeenInPersonAt: new Date("2026-08-01T12:00:00Z"),
    closeness: 4,
    stayInTouchDays: null,
    now,
  });
  assert.equal(snapshot.daysSinceContact, 22);
  assert.equal(snapshot.daysSinceSeen, 41);
  assert.equal(snapshot.overdue, true);
});
