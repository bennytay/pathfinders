import type { Activity, Friend, Prompt, WorkspaceState } from "@/lib/workspace";

export type PromptEligibility = {
  eligible: boolean;
  friendId: string;
  daysSinceInPerson?: number;
  reason: string;
  relevantContext: string[];
};

export type ActivityMatch = { activity: Activity; matchedContext: string[] };

export type PublicEvent = {
  title: string;
  description?: string;
  location?: string;
  startsAt?: string;
  url: string;
  tags?: string[];
};

export interface EventsProvider {
  readonly name: string;
  findActivities(input: { city: string; query: string; from: string; to: string }): Promise<PublicEvent[]>;
}

export class JsonFeedPublicEventsAdapter implements EventsProvider {
  readonly name = "Public events JSON feed";
  constructor(private readonly feedUrl = process.env.NEXT_PUBLIC_EVENTS_FEED_URL) {}

  async findActivities(input: { city: string; query: string; from: string; to: string }): Promise<PublicEvent[]> {
    if (!this.feedUrl) throw new Error("Public events are not configured for this build. You can still add a manual idea.");
    const url = new URL(this.feedUrl);
    url.searchParams.set("city", input.city);
    url.searchParams.set("q", input.query);
    url.searchParams.set("from", input.from);
    url.searchParams.set("to", input.to);
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`The public events provider returned ${response.status}. Try again later or add a manual idea.`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("The public events provider returned an unexpected result. You can still add a manual idea.");
    return data.flatMap((item): PublicEvent[] => isPublicEvent(item) ? [{ ...item, tags: item.tags ?? [] }] : []);
  }
}

export function getPromptEligibility(state: WorkspaceState, friend: Friend, asOf = new Date()): PromptEligibility {
  if (!friend.promptEnabled) return { eligible: false, friendId: friend.id, reason: "You turned reminders off for this person.", relevantContext: [] };
  const prompt = state.prompts.find((item) => item.friendId === friend.id);
  if (prompt?.state === "dismissed") return { eligible: false, friendId: friend.id, reason: "You dismissed this reminder. No new nudge will be shown for this person.", relevantContext: [] };
  if (prompt?.state === "snoozed" && prompt.snoozedUntil && new Date(prompt.snoozedUntil) > asOf) return { eligible: false, friendId: friend.id, reason: `You snoozed this until ${displayDate(prompt.snoozedUntil)}.`, relevantContext: [] };
  const inPerson = state.interactions.filter((item) => item.friendId === friend.id && item.kind === "in-person").sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  if (!inPerson) return { eligible: false, friendId: friend.id, reason: "Log an in-person meetup before using a cadence reminder.", relevantContext: [] };
  const daysSinceInPerson = Math.floor((asOf.getTime() - new Date(inPerson.occurredAt).getTime()) / 86_400_000);
  if (daysSinceInPerson <= friend.cadenceDays) return { eligible: false, friendId: friend.id, daysSinceInPerson, reason: `You chose every ${friend.cadenceDays} days. It has been ${daysSinceInPerson} days since you met.`, relevantContext: [] };
  const pendingPlan = state.planDrafts.find((plan) => plan.friendId === friend.id && (plan.status === "draft" || plan.status === "planned"));
  if (pendingPlan) return { eligible: false, friendId: friend.id, daysSinceInPerson, reason: "You already have an unfinished plan recorded for this person.", relevantContext: [] };
  const relevantContext = confirmedPlanningContext(state, friend.id);
  const contextSentence = relevantContext.length ? ` Confirmed context: ${relevantContext.join(", ")}.` : "";
  return { eligible: true, friendId: friend.id, daysSinceInPerson, relevantContext, reason: `You chose every ${friend.cadenceDays} days, and it has been ${daysSinceInPerson} days since you met.${contextSentence}` };
}

export function getActivityMatches(state: WorkspaceState, friendId: string): ActivityMatch[] {
  const context = confirmedPlanningContext(state, friendId);
  return state.activities.map((activity) => ({ activity, matchedContext: context.filter((fact) => includesConcept(activity, fact)) })).filter((match) => match.matchedContext.length > 0);
}

export function isFresh(activity: Activity, asOf = new Date(), maxAgeHours = 48): boolean {
  return asOf.getTime() - new Date(activity.retrievedAt).getTime() <= maxAgeHours * 3_600_000;
}

export function promptForFriend(prompts: Prompt[], friendId: string) { return prompts.find((prompt) => prompt.friendId === friendId); }

function confirmedPlanningContext(state: WorkspaceState, friendId: string) {
  return state.memoryFacts.filter((fact) => fact.friendId === friendId && (fact.type === "shared-interest" || fact.type === "intention")).map((fact) => fact.value);
}

function includesConcept(activity: Activity, context: string) {
  const haystack = `${activity.title} ${activity.details ?? ""} ${activity.tags.join(" ")}`.toLowerCase();
  return keywords(context).some((term) => haystack.includes(term));
}

function keywords(value: string) { return value.toLowerCase().match(/[a-z]{4,}/g) ?? []; }
function displayDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
function isPublicEvent(value: unknown): value is PublicEvent { if (!value || typeof value !== "object") return false; const event = value as Record<string, unknown>; return typeof event.title === "string" && typeof event.url === "string" && (event.description === undefined || typeof event.description === "string") && (event.location === undefined || typeof event.location === "string") && (event.startsAt === undefined || typeof event.startsAt === "string") && (event.tags === undefined || (Array.isArray(event.tags) && event.tags.every((tag) => typeof tag === "string"))); }
