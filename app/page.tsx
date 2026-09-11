import { getFriends } from "@/lib/demo-data";
import { HangoutPlanner, type PlannerFriend } from "@/components/hangout-planner";
import { daysSince } from "@/lib/social-time";

export default async function Home() {
  const friends = await getFriends();
  const plannerFriends: PlannerFriend[] = friends.map((friend) => ({
    id: friend.id, name: friend.preferred_name, nickname: friend.nickname, university: friend.university, closeness: friend.closeness, crush: friend.crush,
    interests: friend.interests, societies: friend.societies, daysSinceContact: daysSince(friend.last_contacted_at ? new Date(friend.last_contacted_at) : null),
  }));
  return <HangoutPlanner friends={plannerFriends}/>;
}
