"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateSuggestionCards } from "@/lib/suggestions";

const friendSchema = z.object({
  preferredName: z.string().min(1).max(60),
  nickname: z.string().max(60).optional(),
  pronouns: z.string().max(60).optional(),
  university: z.string().min(1).max(100),
  campus: z.string().max(100).optional(),
  degreeProgram: z.string().max(100).optional(),
  yearOfStudy: z.string().max(30).optional(),
  closeness: z.coerce.number().int().min(1).max(5),
  crush: z.enum(["none", "friends", "crush", "dating", "past"]),
  myIntent: z.enum(["friend", "date", "unclear"]),
  howWeMet: z.string().min(1),
  privateNote: z.string().max(2000).optional(),
  instagram: z.string().regex(/^[a-zA-Z0-9._]{1,30}$/).optional(),
  snapchat: z.string().regex(/^[a-zA-Z0-9._-]{1,50}$/).optional(),
});

const eventSchema = z.object({
  title: z.string().min(1).max(120),
  happenedAt: z.coerce.date(),
  channel: z.enum(["in_person", "call", "text", "social", "class", "other"]),
  hangoutType: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  vibe: z.coerce.number().int().min(1).max(5).optional(),
  attendeeIds: z.array(z.string()).min(1),
});

const blankToUndefined = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
};

export async function createFriend(formData: FormData) {
  const parsed = friendSchema.parse({
    preferredName: formData.get("preferredName"), nickname: blankToUndefined(formData.get("nickname")),
    pronouns: blankToUndefined(formData.get("pronouns")), university: formData.get("university") || "UNSW",
    campus: blankToUndefined(formData.get("campus")),
    degreeProgram: blankToUndefined(formData.get("degreeProgram")), yearOfStudy: blankToUndefined(formData.get("yearOfStudy")),
    closeness: formData.get("closeness"), crush: formData.get("crush") || "none", myIntent: ["crush", "dating"].includes(String(formData.get("crush"))) ? "date" : "friend",
    howWeMet: formData.get("howWeMet") || "other", privateNote: blankToUndefined(formData.get("privateNote")),
    instagram: blankToUndefined(formData.get("instagram"))?.replace(/^@/, ""), snapchat: blankToUndefined(formData.get("snapchat"))?.replace(/^@/, ""),
  });
  const { instagram, snapchat, ...friendData } = parsed;
  const friend = await db.friend.create({ data: { ...friendData, contactPoints: { create: [instagram && { kind: "instagram", value: instagram, label: `@${instagram}` }, snapchat && { kind: "snapchat", value: snapchat, label: `@${snapchat}` }].filter(Boolean) as { kind: string; value: string; label: string }[] } } });
  revalidatePath("/"); revalidatePath("/friends"); revalidatePath("/catchup");
  redirect(`/friends/${friend.id}`);
}

export async function createEvent(formData: FormData) {
  const parsed = eventSchema.parse({
    title: formData.get("title"), happenedAt: formData.get("happenedAt"), channel: formData.get("channel"),
    hangoutType: blankToUndefined(formData.get("hangoutType")), location: blankToUndefined(formData.get("location")),
    notes: blankToUndefined(formData.get("notes")), vibe: blankToUndefined(formData.get("vibe")),
    attendeeIds: formData.getAll("attendeeIds").map(String),
  });
  await db.$transaction(async (tx) => {
    await tx.event.create({ data: { ...parsed, attendees: { create: parsed.attendeeIds.map((friendId) => ({ friendId })) } } });
    for (const friendId of parsed.attendeeIds) {
      const existing = await tx.friend.findUniqueOrThrow({ where: { id: friendId }, select: { lastContactedAt: true, lastSeenInPersonAt: true } });
      const lastContactedAt = !existing.lastContactedAt || parsed.happenedAt > existing.lastContactedAt ? parsed.happenedAt : existing.lastContactedAt;
      const inPerson = parsed.channel === "in_person" || parsed.channel === "class";
      const lastSeenInPersonAt = inPerson && (!existing.lastSeenInPersonAt || parsed.happenedAt > existing.lastSeenInPersonAt) ? parsed.happenedAt : existing.lastSeenInPersonAt;
      await tx.friend.update({ where: { id: friendId }, data: { lastContactedAt, lastSeenInPersonAt } });
    }
  });
  revalidatePath("/"); revalidatePath("/friends"); revalidatePath("/events"); revalidatePath("/catchup");
  redirect("/events");
}

export async function generateSuggestions() {
  const friends = await db.friend.findMany({ include: { societies: { include: { society: true } }, interests: { include: { interest: true } } } });
  const cards = generateSuggestionCards(friends);
  await db.suggestion.deleteMany({ where: { status: "pending" } });
  await db.suggestion.createMany({ data: cards });
  revalidatePath("/suggestions");
}

export async function updateSuggestionStatus(formData: FormData) {
  const id = z.string().parse(formData.get("id"));
  const status = z.enum(["saved", "dismissed", "went"]).parse(formData.get("status"));
  const suggestion = await db.suggestion.update({ where: { id }, data: { status } });
  if (status === "went") {
    await db.$transaction(async (tx) => {
      const at = new Date();
      await tx.event.create({ data: { title: suggestion.title, notes: suggestion.detail, happenedAt: at, channel: "in_person", hangoutType: "other", attendees: { create: [{ friendId: suggestion.friendId }] } } });
      await tx.friend.update({ where: { id: suggestion.friendId }, data: { lastContactedAt: at, lastSeenInPersonAt: at } });
    });
    revalidatePath("/"); revalidatePath("/events"); revalidatePath("/friends");
  }
  revalidatePath("/suggestions");
}
