export function daysSince(date: Date | null, now = Date.now()) {
  return date ? Math.max(0, Math.floor((now - date.getTime()) / 86_400_000)) : null;
}
