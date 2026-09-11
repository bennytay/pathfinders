export type ContactSnapshot = {
  lastContactedAt: Date | null;
  lastSeenInPersonAt: Date | null;
  daysSinceContact: number | null;
  daysSinceSeen: number | null;
  stayInTouchDays: number;
  overdue: boolean;
};

export function defaultStayInTouchDays(closeness: number) {
  if (closeness >= 4) return 21;
  if (closeness === 3) return 45;
  return 90;
}

export function daysBetween(from: Date, to = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export function relationshipSnapshot(input: {
  lastContactedAt: Date | null;
  lastSeenInPersonAt: Date | null;
  closeness: number;
  stayInTouchDays: number | null;
  now?: Date;
}): ContactSnapshot {
  const stayInTouchDays = input.stayInTouchDays ?? defaultStayInTouchDays(input.closeness);
  const now = input.now ?? new Date();
  const daysSinceContact = input.lastContactedAt ? daysBetween(input.lastContactedAt, now) : null;
  const daysSinceSeen = input.lastSeenInPersonAt ? daysBetween(input.lastSeenInPersonAt, now) : null;
  return {
    lastContactedAt: input.lastContactedAt,
    lastSeenInPersonAt: input.lastSeenInPersonAt,
    daysSinceContact,
    daysSinceSeen,
    stayInTouchDays,
    overdue: daysSinceContact !== null && daysSinceContact > stayInTouchDays,
  };
}

export function initials(name: string) {
  return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

export function closenessEmoji(closeness: number) {
  return ["👋", "🙂", "💛", "🔥", "👑"][closeness - 1] ?? "👋";
}
