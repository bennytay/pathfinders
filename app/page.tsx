import { db } from "@/lib/db";
import { HangoutPlanner, type PlannerFriend } from "@/components/hangout-planner";
import { daysSince } from "@/lib/social-time";

export default async function Home() {
  const friends = await db.friend.findMany({
    orderBy: [{ closeness: "desc" }, { preferredName: "asc" }],
    include: { interests: { include: { interest: true } }, societies: { include: { society: true } } },
  });
  const plannerFriends: PlannerFriend[] = friends.map((friend) => ({
    id: friend.id, name: friend.preferredName, nickname: friend.nickname, university: friend.university, closeness: friend.closeness, crush: friend.crush,
    interests: friend.interests.map(({ interest }) => interest.name), societies: friend.societies.map(({ society }) => society.name),
    daysSinceContact: daysSince(friend.lastContactedAt),
  }));
  return <HangoutPlanner friends={plannerFriends}/>;
}
