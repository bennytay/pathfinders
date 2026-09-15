import { fixturePhotoAnalysisAdapter } from "@/lib/photo-analysis";
import { BETA_ACTIVE_FRIEND_LIMIT, CURRENT_SCHEMA_VERSION, type WorkspaceState } from "@/lib/workspace";

export { BETA_ACTIVE_FRIEND_LIMIT };

export function getFixtureWorkspace(): WorkspaceState {
  const friendSeed = [
    ["priya-shah", "Priya Shah", "bouldering"], ["hana-kim", "Hana Kim", "ceramics"], ["arjun-patel", "Arjun Patel", "live music"], ["rohan-mehta", "Rohan Mehta", "film"], ["isla-morgan", "Isla Morgan", "running"],
    ["haru-sato", "Haru Sato", "vintage"], ["tyler-woodward", "Tyler Woodward", "drawing"], ["yingying-zhang", "Yingying Zhang", "books"],
  ] as const;
  const addresses = ["14 Station St, Newtown", "8 Crown St, Surry Hills", "31 Illawarra Rd, Marrickville", "22 Liverpool St, Darlinghurst", "5 George St, Redfern", "18 Bridge Rd, Glebe", "9 Underwood St, Paddington", "46 Abercrombie St, Chippendale"];
  const friends = friendSeed.map(([id, displayName], index) => ({ id, displayName, address: addresses[index], cadenceDays: 14, promptEnabled: true, archived: false, createdAt: "2026-08-01T00:00:00.000Z" }));
  const notes = [{ id: "priya-bouldering-reflection", text: "Synthetic example: Priya said she wants to try bouldering next week and just started her internship.", friendIds: ["priya-shah"], capturedAt: "2026-08-21T08:30:00.000Z", state: "saved" as const, transcriptionMode: "manual-text" as const }, ...friendSeed.slice(1).map(([id, displayName, interest]) => ({ id: `${id}-note`, text: `Synthetic example: ${displayName} is up for ${interest}.`, friendIds: [id], capturedAt: "2026-08-21T08:30:00.000Z", state: "saved" as const, transcriptionMode: "manual-text" as const }))];
  const memoryFacts = [{ id: "priya-bouldering-memory", friendId: "priya-shah", sourceNoteId: "priya-bouldering-reflection", proposalId: "priya-bouldering-proposal", type: "intention", value: "try bouldering next week", approvedAt: "2026-08-21T08:40:00.000Z", adapter: "fixture-extractor-v1" as const, confidence: 0.88, editHistory: [] }, ...friendSeed.slice(1).map(([id, , interest]) => ({ id: `${id}-memory`, friendId: id, sourceNoteId: `${id}-note`, proposalId: `${id}-proposal`, type: "shared-interest", value: interest, approvedAt: "2026-08-21T08:40:00.000Z", adapter: "fixture-extractor-v1" as const, confidence: 0.88, editHistory: [] }))];
  const activities = [
    ["beginner-bouldering", "Beginner bouldering", "Wed, 6:30pm", "The Bouldering Project", ["bouldering", "climbing"]], ["clay-social", "Clay social", "Thu, 7pm", "Kil.n Studio", ["ceramics", "clay"]],
    ["harbour-jazz", "Harbour jazz club", "Thu, 8pm", "The Vanguard", ["live music", "jazz"]], ["rooftop-cinema", "Rooftop cinema", "Fri, 7:15pm", "Golden Age", ["film", "cinema"]],
    ["run-club", "Run club to happy hour", "Sat, 9am", "Darling Harbour", ["running", "run"]], ["vintage-market", "Sunday vintage market", "Sun, 10am", "Carriageworks", ["vintage", "market"]],
    ["figure-drawing", "Figure drawing night", "Sun, 6pm", "The Studio", ["drawing", "art"]], ["silent-reading", "Silent reading hour", "Mon, 6pm", "Sappho Books", ["books", "reading"]],
    ["warehouse-dance", "Warehouse dance class", "Mon, 7:30pm", "Red Rattler", ["dance", "movement"]], ["night-market", "Night noodle market", "Tue, 6pm", "Haymarket", ["food", "dinner"]],
    ["open-mic", "Open mic at the pub", "Tue, 8pm", "The Bearded Tit", ["live music", "music"]], ["morning-swim", "Early ocean swim", "Wed, 7am", "Bondi Icebergs", ["running", "movement"]],
    ["zine-fair", "Small press zine fair", "Sat, 11am", "UTS Gallery", ["drawing", "books"]], ["pasta-club", "Pasta club", "Sat, 7pm", "Pellegrino 2000", ["food", "dinner"]],
    ["foreign-film", "Foreign film night", "Sun, 5pm", "Chauvel Cinema", ["film", "cinema"]], ["record-fair", "Record fair", "Sun, 12pm", "Oxford Art Factory", ["live music", "music"]],
    ["park-pilates", "Park pilates", "Next Mon, 6pm", "Victoria Park", ["dance", "movement"]], ["book-launch", "Book launch and drinks", "Next Tue, 7pm", "Gleebooks", ["books", "reading"]],
  ] as const;
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION, fixtureMode: true, city: "Sydney", circle: { id: "circle-fixture", name: "Circle", maxMembers: BETA_ACTIVE_FRIEND_LIMIT },
    friends,
    notes,
    interactions: friendSeed.map(([id]) => ({ id: `${id}-last-meetup`, friendId: id, kind: "in-person" as const, occurredAt: "2026-08-21T18:00:00.000Z", note: "Synthetic fixture" })),
    momentCandidates: [],
    confirmedHangouts: [],
    factProposals: [{ id: "priya-internship-proposal", friendId: "priya-shah", sourceNoteId: "priya-bouldering-reflection", type: "preference", value: "started her internship", sourceSpan: { start: 77, end: 99, text: "started her internship" }, confidence: 0.72, suggestedIntent: "remember", adapter: "fixture-extractor-v1", status: "pending", createdAt: "2026-08-21T08:30:00.000Z" }], memoryFacts,
    activities: activities.map(([id, title, details, location, tags]) => ({ id, title, details, location, source: "fixture" as const, retrievedAt: "2026-09-14T08:30:00.000Z", tags: [...tags] })),
    prompts: [], planDrafts: [],
    privacySettings: { audioRetention: "transcript-only", telemetryOptIn: false, remoteProcessingDefault: "ask-every-note", updatedAt: "2026-09-14T08:30:00.000Z" }, migrationHistory: [{ version: CURRENT_SCHEMA_VERSION, migratedAt: "2026-09-14T08:30:00.000Z" }],
  };
}

export function getFixtureMomentCandidate() { return fixturePhotoAnalysisAdapter.analyze(); }

export function getFailureFixture(): WorkspaceState { const state = getFixtureWorkspace(); return { ...state, friends: Array.from({ length: BETA_ACTIVE_FRIEND_LIMIT }, (_, index) => ({ id: `fixture-${index}`, displayName: `Fixture friend ${index + 1}`, cadenceDays: 14, promptEnabled: true, archived: false, createdAt: "2026-09-14T08:30:00.000Z" })), notes: [], interactions: [], momentCandidates: [], confirmedHangouts: [], factProposals: [], memoryFacts: [] }; }
export function validateFixtureWorkspace(workspace: WorkspaceState): string[] { const issues: string[] = []; if (!workspace.fixtureMode) issues.push("Fixture workspaces must be marked synthetic."); if (workspace.friends.length > BETA_ACTIVE_FRIEND_LIMIT) issues.push(`Fixture exceeds the beta limit of ${BETA_ACTIVE_FRIEND_LIMIT} active friends.`); if (workspace.notes.some((note) => !note.text.includes("Synthetic"))) issues.push("Fixtures must make synthetic notes obvious."); if (workspace.momentCandidates.some((moment) => moment.analysisKind !== "fixture")) issues.push("Fixture moments must identify their synthetic analysis source."); return issues; }
