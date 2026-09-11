import { z } from "zod";
import { db } from "@/lib/db";
import { daysSince } from "@/lib/social-time";

export const runtime = "nodejs";

const requestSchema = z.object({ message: z.string().trim().min(1).max(1_200) });
const replySchema = z.object({
  reply: z.string().min(1).max(360),
  plan: z.object({ mood: z.string().min(1).max(40), setting: z.string().min(1).max(60), size: z.string().min(1).max(40), when: z.string().min(1).max(40) }),
  recommendedFriendIds: z.array(z.string()).max(3),
  reasons: z.record(z.string(), z.string().max(180)).default({}),
});

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
}

function apiError(error: string, status: number, detail?: string) {
  return Response.json({ error, ...(detail ? { detail } : {}) }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return apiError("Circle AI is not configured yet.", 503);

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return apiError("Please send a message of up to 1,200 characters.", 400);

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const friends = await db.friend.findMany({
      select: { id: true, preferredName: true, nickname: true, university: true, closeness: true, lastContactedAt: true, interests: { select: { interest: { select: { name: true } } } }, societies: { select: { society: { select: { name: true } } } } },
      orderBy: [{ closeness: "desc" }, { preferredName: "asc" }],
      take: 30,
    });
    const contactContext = friends.map((friend) => ({ id: friend.id, name: friend.nickname || friend.preferredName, university: friend.university, closeness: friend.closeness, daysSinceContact: daysSince(friend.lastContactedAt), interests: friend.interests.map(({ interest }) => interest.name), societies: friend.societies.map(({ society }) => society.name) }));
    const instruction = "You are Circle, a thoughtful social-planning assistant for university students. Recommend only people from the supplied contact list. Never claim anyone is available, interested, or wants to meet. Be casual, brief, and kind. Return one JSON object, with no Markdown or extra keys: { reply: string, plan: { mood: string, setting: string, size: string, when: string }, recommendedFriendIds: string[], reasons: Record<string, string> }. Recommend zero to three supplied ids only. reasons maps each recommended id to one specific, non-judgemental sentence.";
    const model = (process.env.GEMINI_MODEL || "gemini-3.5-flash").replace(/^models\//, "");
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 25_000);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts: [{ text: `User request: ${parsed.data.message}\n\nContacts: ${JSON.stringify(contactContext)}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 2_048 } }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const providerError = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      const detail = process.env.NODE_ENV === "development" ? providerError?.error?.message : undefined;
      return apiError("Circle AI is temporarily unavailable.", 502, detail);
    }
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    const answer = replySchema.safeParse(JSON.parse(cleanJson(text)));
    if (!answer.success) return apiError("Circle AI returned an incomplete plan. Please try again.", 502);
    const validIds = new Set(friends.map((friend) => friend.id));
    const payload = answer.data;
    payload.recommendedFriendIds = payload.recommendedFriendIds.filter((id) => validIds.has(id));
    payload.reasons = Object.fromEntries(Object.entries(payload.reasons).filter(([id]) => validIds.has(id)));
    return Response.json(payload);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return apiError("Circle AI took too long to respond. Please try again.", 504);
    return apiError("Circle AI is temporarily unavailable.", 502, process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
