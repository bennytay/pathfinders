import { BETA_ACTIVE_FRIEND_LIMIT, CURRENT_SCHEMA_VERSION, type Friend, type PhotoLibraryEntry, type WorkspaceState } from "@/lib/workspace";

export { BETA_ACTIVE_FRIEND_LIMIT };

const POSTGAME_PHOTO = "/highlights/postgame.jpeg"; // three friends on a curb outside a beach bar at night
const GO_KARTING_PHOTO = "/highlights/go-karting.jpeg"; // helmeted group selfie at an indoor go-kart raceway
const CAFE_NIGHT_PHOTO = "/highlights/cafe-night.jpeg"; // cozy cafe table, laptop open to Minecraft
const SPIKEBALL_PHOTO = "/highlights/spikeball.jpeg"; // four friends playing spikeball at dusk in a park
const LOUNGE_CANDLES_PHOTO = "/highlights/lounge-candles.jpeg"; // candlelit lounge table, late-night talk
const BIRTHDAY_DANCE_PHOTO = "/highlights/birthday-dance.jpeg"; // dancing under a birthday banner
const SUNSET_BASKETBALL_PHOTO = "/highlights/sunset-basketball.jpeg"; // pickup basketball, palm trees, sunset
const POOL_NIGHT_PHOTO = "/highlights/pool-night.jpeg"; // playing pool at a bar
const CENTRAL_PARK_PHOTO = "/highlights/central-park.jpeg"; // lying in the grass in Central Park
const BEACH_SOCCER_PHOTO = "/highlights/beach-soccer.jpeg"; // kicking a ball on the beach at sunset

export function getFixturePhotoLibraryScan(friends: Pick<Friend, "id" | "archived">[]): PhotoLibraryEntry[] {
  const active = new Set(friends.filter((friend) => !friend.archived).map((friend) => friend.id));
  const entries: PhotoLibraryEntry[] = [
    { photo: { assetId: "scan-basketball-priya", label: "Pickup basketball", caption: "One more game before the sun went down.", capturedAt: "2026-09-06T18:30:00.000Z", place: "The Courts", src: SUNSET_BASKETBALL_PHOTO }, candidateFriendIds: ["priya-shah"], noteText: "Synthetic photo-scan: Priya spent the whole game talking about how she wants to try the new bouldering gym.", fact: { type: "intention", value: "wants to try the new bouldering gym" } },
    { photo: { assetId: "scan-cafe-hana", label: "Late-night coffee", caption: "Coffee that turned into two hours of nothing important.", capturedAt: "2026-09-07T20:00:00.000Z", place: "The Corner Cafe", src: CAFE_NIGHT_PHOTO }, candidateFriendIds: ["hana-kim"], noteText: "Synthetic photo-scan: Hana's hands still had clay on them at the cafe — she's obsessed with ceramics lately.", fact: { type: "preference", value: "obsessed with ceramics lately" } },
    { photo: { assetId: "scan-dance-arjun", label: "Birthday dance floor", caption: "First one on the dance floor, as usual.", capturedAt: "2026-09-08T21:00:00.000Z", place: "The Birthday Party", src: BIRTHDAY_DANCE_PHOTO }, candidateFriendIds: ["arjun-patel"], noteText: "Synthetic photo-scan: Arjun was first on the dance floor — he can't get enough of live music lately.", fact: { type: "preference", value: "can't get enough of live music lately" } },
    { photo: { assetId: "scan-lounge-rohan", label: "Candlelit lounge", caption: "Candlelight and a conversation that ran long.", capturedAt: "2026-09-09T22:00:00.000Z", place: "The Lounge", src: LOUNGE_CANDLES_PHOTO }, candidateFriendIds: ["rohan-mehta"], noteText: "Synthetic photo-scan: Rohan kept checking movie times from the table — always up for a good film after.", fact: { type: "preference", value: "always up for a good film after" } },
    { photo: { assetId: "scan-soccer-isla", label: "Sunset on the beach", caption: "Kicking the ball around until the light was gone.", capturedAt: "2026-09-10T18:00:00.000Z", place: "The Beach", src: BEACH_SOCCER_PHOTO }, candidateFriendIds: ["isla-morgan"], noteText: "Synthetic photo-scan: Isla watched the sunset after and said she wants to make morning runs a regular thing.", fact: { type: "intention", value: "wants to make morning runs a regular thing" } },
    { photo: { assetId: "scan-postgame-haru", label: "Postgame outside the bar", caption: "Still laughing about it outside the bar after.", capturedAt: "2026-09-11T20:30:00.000Z", place: "The Boardwalk Bar", src: POSTGAME_PHOTO }, candidateFriendIds: ["haru-sato"], noteText: "Synthetic photo-scan: Haru showed up in another incredible thrifted jacket — always hunting for vintage finds.", fact: { type: "shared-interest", value: "hunting for vintage finds" } },
    { photo: { assetId: "scan-park-tyler", label: "Central Park afternoon", caption: "Flat on our backs, in no rush to leave.", capturedAt: "2026-09-12T14:00:00.000Z", place: "Central Park", src: CENTRAL_PARK_PHOTO }, candidateFriendIds: ["tyler-woodward"], noteText: "Synthetic photo-scan: Tyler had his sketchbook out in the grass — back into drawing again.", fact: { type: "preference", value: "back into drawing again" } },
    { photo: { assetId: "scan-karting-yingying", label: "Go-kart night", caption: "One more lap before we called it a night.", capturedAt: "2026-09-13T16:00:00.000Z", place: "The Go-Kart Track", src: GO_KARTING_PHOTO }, candidateFriendIds: ["yingying-zhang"], noteText: "Synthetic photo-scan: Yingying spent the whole ride recommending books between laps.", fact: { type: "shared-interest", value: "recommending books between laps" } },
    { photo: { assetId: "scan-spikeball-priya-isla", label: "Spikeball in the park", caption: "Nobody wanted to admit they were losing.", capturedAt: "2026-09-13T19:00:00.000Z", place: "The Park", src: SPIKEBALL_PHOTO }, candidateFriendIds: ["isla-morgan", "priya-shah"], noteText: "Synthetic photo-scan: Isla dove for every point — she's really back into her movement classes lately.", fact: { type: "shared-interest", value: "back into her movement classes lately" } },
    { photo: { assetId: "scan-pool-rohan-tyler", label: "Pool at the bar", caption: "Down two games, still talking trash.", capturedAt: "2026-09-14T21:30:00.000Z", place: "The Pool Hall", src: POOL_NIGHT_PHOTO }, candidateFriendIds: ["rohan-mehta", "tyler-woodward"], noteText: "Synthetic photo-scan: Rohan already picked the place for dinner after — always suggests where to get dinner.", fact: { type: "shared-interest", value: "always suggests where to get dinner" } },
  ];
  return entries.filter((entry) => entry.candidateFriendIds.every((friendId) => active.has(friendId)));
}

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
    privacySettings: { audioRetention: "transcript-only", telemetryOptIn: false, remoteProcessingDefault: "ask-every-note", updatedAt: "2026-09-14T08:30:00.000Z" }, photoLibrary: { granted: false }, photoStars: [], migrationHistory: [{ version: CURRENT_SCHEMA_VERSION, migratedAt: "2026-09-14T08:30:00.000Z" }],
  };
}

export function getFailureFixture(): WorkspaceState { const state = getFixtureWorkspace(); return { ...state, friends: Array.from({ length: BETA_ACTIVE_FRIEND_LIMIT }, (_, index) => ({ id: `fixture-${index}`, displayName: `Fixture friend ${index + 1}`, cadenceDays: 14, promptEnabled: true, archived: false, createdAt: "2026-09-14T08:30:00.000Z" })), notes: [], interactions: [], momentCandidates: [], confirmedHangouts: [], factProposals: [], memoryFacts: [] }; }
export function validateFixtureWorkspace(workspace: WorkspaceState): string[] { const issues: string[] = []; if (!workspace.fixtureMode) issues.push("Fixture workspaces must be marked synthetic."); if (workspace.friends.length > BETA_ACTIVE_FRIEND_LIMIT) issues.push(`Fixture exceeds the beta limit of ${BETA_ACTIVE_FRIEND_LIMIT} active friends.`); if (workspace.notes.some((note) => !note.text.includes("Synthetic"))) issues.push("Fixtures must make synthetic notes obvious."); if (workspace.momentCandidates.some((moment) => moment.analysisKind !== "fixture")) issues.push("Fixture moments must identify their synthetic analysis source."); return issues; }
