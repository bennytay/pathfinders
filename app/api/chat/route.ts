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

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Circle AI is not configured yet." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Please send a shorter message." }, { status: 400 });

  const friends = await db.friend.findMany({
    select: { id: true, preferredName: true, nickname: true, university: true, closeness: true, lastContactedAt: true, interests: { select: { interest: { select: { name: true } } } }, societies: { select: { society: { select: { name: true } } } } },
    orderBy: [{ closeness: "desc" }, { preferredName: "asc" }],
    take: 30,
  });
  const contactContext = friends.map((friend) => ({ id: friend.id, name: friend.nickname || friend.preferredName, university: friend.university, closeness: friend.closeness, daysSinceContact: daysSince(friend.lastContactedAt), interests: friend.interests.map(({ interest }) => interest.name), societies: friend.societies.map(({ society }) => society.name) }));
  const instruction = "You are Circle, a thoughtful social-planning assistant for university students. Recommend only people from the supplied contact list. Never claim anyone is available, interested, or wants to meet. Be casual, brief, and kind. Return only valid JSON with exactly reply, plan, recommendedFriendIds, and reasons. plan must contain mood, setting, size, when. Recommend zero to three ids, never invent ids. reasons maps an id to one specific, non-judgemental sentence.";

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts: [{ text: `User request: ${parsed.data.message}\n\nContacts: ${JSON.stringify(contactContext)}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.55, maxOutputTokens: 500 } }),
    });
    if (!response.ok) {
      const providerError = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      const detail = process.env.NODE_ENV === "development" ? providerError?.error?.message : undefined;
      return Response.json({ error: "Circle AI is temporarily unavailable.", detail }, { status: 502 });
    }
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    const answer = replySchema.parse(JSON.parse(cleanJson(text)));
    const validIds = new Set(friends.map((friend) => friend.id));
    answer.recommendedFriendIds = answer.recommendedFriendIds.filter((id) => validIds.has(id));
    answer.reasons = Object.fromEntries(Object.entries(answer.reasons).filter(([id]) => validIds.has(id)));
    return Response.json(answer);
  } catch {
    return Response.json({ error: "Circle AI gave an unreadable response." }, { status: 502 });
  }
}
