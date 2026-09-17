import assert from "node:assert/strict";
import test from "node:test";
import { getActivityMatches, getPromptEligibility, JsonFeedPublicEventsAdapter } from "@/lib/planning";
import { getFixtureWorkspace } from "@/lib/fixtures";
import { LocalWorkspaceRepository, type StorageLike } from "@/lib/workspace";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const asOf = new Date("2026-09-14T12:00:00.000Z");

test("eligibility is transparent, cadence-based, and ignores unreviewed proposals", () => {
  const state = getFixtureWorkspace();
  const maya = state.friends[0];
  const eligible = getPromptEligibility(state, maya, asOf);
  assert.equal(eligible.eligible, true);
  assert.match(eligible.reason, /every 14 days/);
  assert.match(eligible.reason, /23 days since you met/);
  assert.ok(eligible.relevantContext.includes("try bouldering next week"));
  state.memoryFacts = [];
  assert.deepEqual(getPromptEligibility(state, maya, asOf).relevantContext, []);
});

test("a snooze, disabled reminder, or unfinished plan suppresses a nudge", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  const maya = repository.load().friends[0];
  repository.setPrompt(maya.id, { state: "snoozed", reason: "Later", snoozedUntil: "2026-09-20T00:00:00.000Z" });
  assert.equal(getPromptEligibility(repository.load(), maya, asOf).eligible, false);
  repository.setPromptEnabled(maya.id, false);
  assert.match(getPromptEligibility(repository.load(), repository.load().friends[0], asOf).reason, /turned reminders off/);
  repository.setPromptEnabled(maya.id, true);
  repository.setPrompt(maya.id, { state: "dismissed", reason: "Not now" });
  assert.match(getPromptEligibility(repository.load(), repository.load().friends[0], asOf).reason, /dismissed/);
  repository.seed(getFixtureWorkspace());
  repository.createPlan({ friendId: maya.id, message: "Want to make pottery?" });
  assert.match(getPromptEligibility(repository.load(), repository.load().friends[0], asOf).reason, /unfinished plan/);
});

test("activities match only confirmed shared interests or intentions and plan outcomes are explicit", () => {
  const repository = new LocalWorkspaceRepository(new MemoryStorage());
  repository.seed(getFixtureWorkspace());
  const maya = repository.load().friends[0];
  assert.equal(getActivityMatches(repository.load(), maya.id)[0].activity.id, "beginner-bouldering");
  repository.createPlan({ friendId: maya.id, message: "Want to make pottery?" });
  const plan = repository.load().planDrafts[0];
  assert.equal(repository.recordPlanOutcome(plan.id, "met").planDrafts[0].status, "met");
});

test("the optional public-events adapter fails closed when no feed is configured", async () => {
  await assert.rejects(new JsonFeedPublicEventsAdapter("").findActivities({ city: "Sydney", query: "pottery", from: "2026-09-14", to: "2026-10-14" }), /not configured/);
});
