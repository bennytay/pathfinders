export const CURRENT_SCHEMA_VERSION = 2;
export const BETA_ACTIVE_FRIEND_LIMIT = 5;
export const LOCAL_WORKSPACE_KEY = "innercircle.workspace";

export type Id = string;
export type Friend = { id: Id; displayName: string; cadenceDays: number; archived: boolean; createdAt: string };
export type Note = { id: Id; text: string; capturedAt: string; friendIds: Id[]; state: "saved"; audioId?: Id; transcriptionMode: "manual-text" | "remote-opt-in" };
export type Interaction = { id: Id; friendId: Id; kind: "in-person" | "remote"; occurredAt: string; note?: string };
export type FactProposal = { id: Id; friendId: Id; sourceNoteId: Id; type: string; value: string; confidence: number; status: "pending" | "rejected" | "approved"; createdAt: string };
export type MemoryFact = { id: Id; friendId: Id; sourceNoteId: Id; type: string; value: string; approvedAt: string; editHistory: string[] };
export type Activity = { id: Id; title: string; details?: string; source: "manual" | "fixture"; retrievedAt: string; tags: string[] };
export type Prompt = { id: Id; friendId: Id; reason: string; state: "active" | "snoozed" | "dismissed"; generatedAt: string };
export type PlanDraft = { id: Id; friendId: Id; activityId?: Id; message: string; status: "draft" | "planned" | "not-now"; createdAt: string };
export type PrivacySettings = { audioRetention: "transcript-only" | "retain-until-deletion"; telemetryOptIn: boolean; remoteProcessingDefault: "ask-every-note"; updatedAt: string };
export type WorkspaceState = {
  schemaVersion: number; fixtureMode: boolean; city: string; circle: { id: Id; name: string; maxMembers: number } | null; friends: Friend[]; notes: Note[]; interactions: Interaction[]; factProposals: FactProposal[]; memoryFacts: MemoryFact[]; activities: Activity[]; prompts: Prompt[]; planDrafts: PlanDraft[]; privacySettings: PrivacySettings; migrationHistory: Array<{ version: number; migratedAt: string }>;
};
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export function emptyWorkspace(): WorkspaceState {
  const createdAt = now();
  return { schemaVersion: CURRENT_SCHEMA_VERSION, fixtureMode: false, city: "", circle: null, friends: [], notes: [], interactions: [], factProposals: [], memoryFacts: [], activities: [], prompts: [], planDrafts: [], privacySettings: { audioRetention: "transcript-only", telemetryOptIn: false, remoteProcessingDefault: "ask-every-note", updatedAt: createdAt }, migrationHistory: [{ version: CURRENT_SCHEMA_VERSION, migratedAt: createdAt }] };
}
export function migrateWorkspace(input: unknown): WorkspaceState {
  if (!input || typeof input !== "object") return emptyWorkspace();
  let value = input as Partial<WorkspaceState>;
  if ((value.schemaVersion ?? 0) > CURRENT_SCHEMA_VERSION) return emptyWorkspace();
  while ((value.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION) {
    if ((value.schemaVersion ?? 0) === 0) value = migrateV0ToV1(value);
    else if (value.schemaVersion === 1) value = migrateV1ToV2(value);
    else return emptyWorkspace();
  }
  const base = emptyWorkspace();
  return { ...base, ...value, circle: value.circle ?? null, friends: value.friends ?? [], notes: value.notes ?? [], interactions: value.interactions ?? [], factProposals: value.factProposals ?? [], memoryFacts: value.memoryFacts ?? [], activities: value.activities ?? [], prompts: value.prompts ?? [], planDrafts: value.planDrafts ?? [], privacySettings: { ...base.privacySettings, ...value.privacySettings }, migrationHistory: value.migrationHistory?.length ? value.migrationHistory : base.migrationHistory };
}
function migrateV0ToV1(value: Partial<WorkspaceState>): Partial<WorkspaceState> { return { ...value, schemaVersion: 1, migrationHistory: [...(value.migrationHistory ?? []), { version: 1, migratedAt: now() }] }; }
function migrateV1ToV2(value: Partial<WorkspaceState>): Partial<WorkspaceState> { return { ...value, schemaVersion: 2, notes: value.notes?.map((note) => ({ ...note, transcriptionMode: "manual-text" })) ?? [], migrationHistory: [...(value.migrationHistory ?? []), { version: 2, migratedAt: now() }] }; }
export const activeFriendCount = (state: WorkspaceState) => state.friends.filter((friend) => !friend.archived).length;

export class LocalWorkspaceRepository {
  constructor(private readonly storage: StorageLike, private readonly key = LOCAL_WORKSPACE_KEY) {}
  load(): WorkspaceState { const raw = this.storage.getItem(this.key); if (!raw) return emptyWorkspace(); try { return migrateWorkspace(JSON.parse(raw)); } catch { return emptyWorkspace(); } }
  save(state: WorkspaceState): WorkspaceState { this.storage.setItem(this.key, JSON.stringify(state)); return state; }
  seed(fixture: WorkspaceState): WorkspaceState { return this.save(structuredClone(fixture)); }
  reset(): WorkspaceState { this.storage.removeItem(this.key); return emptyWorkspace(); }
  export(): string { return JSON.stringify(this.load(), null, 2); }
  createCircle(input: { name: string; city: string; maxMembers?: number }): WorkspaceState { const state = this.load(); if (state.circle) throw new Error("A circle already exists."); const maxMembers = Math.min(input.maxMembers ?? BETA_ACTIVE_FRIEND_LIMIT, BETA_ACTIVE_FRIEND_LIMIT); return this.save({ ...state, city: input.city.trim(), circle: { id: makeId("circle"), name: input.name.trim(), maxMembers } }); }
  addFriend(input: { displayName: string; cadenceDays: number }): WorkspaceState { const state = this.load(); if (!state.circle) throw new Error("Create a circle first."); if (activeFriendCount(state) >= state.circle.maxMembers) throw new Error(`This beta circle supports up to ${state.circle.maxMembers} active friends.`); const name = input.displayName.trim(); if (!name) throw new Error("A friend needs a display name."); return this.save({ ...state, friends: [...state.friends, { id: makeId("friend"), displayName: name, cadenceDays: input.cadenceDays, archived: false, createdAt: now() }] }); }
  createNote(input: { text: string; friendIds: Id[]; capturedAt?: string; audioId?: Id; transcriptionMode?: Note["transcriptionMode"] }): WorkspaceState { const state = this.load(); const text = input.text.trim(); if (!text) throw new Error("Write or transcribe a reflection before saving it."); return this.save({ ...state, notes: [{ id: makeId("note"), text, friendIds: input.friendIds, capturedAt: input.capturedAt ?? now(), state: "saved", audioId: input.audioId, transcriptionMode: input.transcriptionMode ?? "manual-text" }, ...state.notes] }); }
  logInteraction(input: { friendId: Id; occurredAt: string; note?: string; kind?: Interaction["kind"] }): WorkspaceState { const state = this.load(); return this.save({ ...state, interactions: [{ id: makeId("interaction"), friendId: input.friendId, kind: input.kind ?? "in-person", occurredAt: input.occurredAt, note: input.note?.trim() }, ...state.interactions] }); }
  addFactProposal(input: Omit<FactProposal, "id" | "status" | "createdAt">): WorkspaceState { const state = this.load(); return this.save({ ...state, factProposals: [{ ...input, id: makeId("proposal"), status: "pending", createdAt: now() }, ...state.factProposals] }); }
  approveProposal(proposalId: Id): WorkspaceState { const state = this.load(); const proposal = state.factProposals.find((item) => item.id === proposalId); if (!proposal || proposal.status !== "pending") return state; return this.save({ ...state, factProposals: state.factProposals.map((item) => item.id === proposalId ? { ...item, status: "approved" } : item), memoryFacts: [{ id: makeId("memory"), friendId: proposal.friendId, sourceNoteId: proposal.sourceNoteId, type: proposal.type, value: proposal.value, approvedAt: now(), editHistory: [] }, ...state.memoryFacts] }); }
  rejectProposal(proposalId: Id): WorkspaceState { const state = this.load(); return this.save({ ...state, factProposals: state.factProposals.map((item) => item.id === proposalId ? { ...item, status: "rejected" } : item) }); }
  addActivity(input: { title: string; details?: string; tags?: string[] }): WorkspaceState { const state = this.load(); const title = input.title.trim(); if (!title) throw new Error("An activity needs a title."); return this.save({ ...state, activities: [{ id: makeId("activity"), title, details: input.details?.trim(), tags: input.tags ?? [], source: "manual", retrievedAt: now() }, ...state.activities] }); }
  createPlan(input: { friendId: Id; activityId?: Id; message: string }): WorkspaceState { const state = this.load(); const message = input.message.trim(); if (!message) throw new Error("A plan draft needs a message."); return this.save({ ...state, planDrafts: [{ id: makeId("plan"), friendId: input.friendId, activityId: input.activityId, message, status: "draft", createdAt: now() }, ...state.planDrafts] }); }
  updatePrivacySettings(input: Partial<PrivacySettings>): WorkspaceState { const state = this.load(); return this.save({ ...state, privacySettings: { ...state.privacySettings, ...input, updatedAt: now() } }); }
  deleteFriend(friendId: Id): WorkspaceState { const state = this.load(); const noteIds = new Set(state.notes.filter((note) => note.friendIds.includes(friendId)).map((note) => note.id)); return this.save({ ...state, friends: state.friends.filter((item) => item.id !== friendId), notes: state.notes.filter((item) => !item.friendIds.includes(friendId)), interactions: state.interactions.filter((item) => item.friendId !== friendId), factProposals: state.factProposals.filter((item) => item.friendId !== friendId && !noteIds.has(item.sourceNoteId)), memoryFacts: state.memoryFacts.filter((item) => item.friendId !== friendId && !noteIds.has(item.sourceNoteId)), prompts: state.prompts.filter((item) => item.friendId !== friendId), planDrafts: state.planDrafts.filter((item) => item.friendId !== friendId) }); }
}
