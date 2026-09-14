export const BETA_ACTIVE_FRIEND_LIMIT = 5;

export type FixtureFriend = { id: string; displayName: string; cadenceDays: number; lastInPersonAt: string; confirmedInterests: string[] };
export type FixtureWorkspace = {
  id: string;
  label: string;
  isSynthetic: true;
  city: string;
  friends: FixtureFriend[];
  notes: Array<{ id: string; text: string; capturedAt: string; audioReference: null }>;
};

const fixtureWorkspace: FixtureWorkspace = {
  id: "fixture-innercircle-sydney",
  label: "Synthetic demo workspace — not a real social circle",
  isSynthetic: true,
  city: "Sydney",
  friends: [
    { id: "maya-chen", displayName: "Maya Chen", cadenceDays: 14, lastInPersonAt: "2026-08-21", confirmedInterests: ["ceramic classes"] },
    { id: "jordan-lee", displayName: "Jordan Lee", cadenceDays: 14, lastInPersonAt: "2026-09-03", confirmedInterests: ["running", "early coffee"] },
    { id: "eli-park", displayName: "Eli Park", cadenceDays: 21, lastInPersonAt: "2026-09-09", confirmedInterests: ["small live music venues"] },
  ],
  notes: [{ id: "maya-pottery-reflection", text: "Synthetic example: Maya mentioned missing making things after a busy week. A pottery class could be a nice plan.", capturedAt: "2026-09-14T08:30:00.000Z", audioReference: null }],
};

export function getFixtureWorkspace(): FixtureWorkspace { return structuredClone(fixtureWorkspace); }

export function validateFixtureWorkspace(workspace: FixtureWorkspace): string[] {
  const issues: string[] = [];
  if (!workspace.isSynthetic) issues.push("Fixture workspaces must be marked synthetic.");
  if (workspace.friends.length > BETA_ACTIVE_FRIEND_LIMIT) issues.push(`Fixture exceeds the beta limit of ${BETA_ACTIVE_FRIEND_LIMIT} active friends.`);
  if (workspace.notes.some((note) => note.audioReference !== null)) issues.push("Fixtures must not contain recordings.");
  return issues;
}
