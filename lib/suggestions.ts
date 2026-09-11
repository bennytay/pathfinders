import { defaultStayInTouchDays } from "./relationship";

type IdeaFriend = {
  id: string;
  preferredName: string;
  closeness: number;
  lastContactedAt: Date | null;
  stayInTouchDays: number | null;
  societies: { society: { name: string } }[];
  interests: { interest: { name: string } }[];
};

const templates = [
  ["mid-sem drinks", "Pick a low-stakes mid-sem drinks spot near campus."],
  ["society BBQ", "Catch the next society BBQ and make a cameo together."],
  ["college formal", "Send the formal invite before the group chat gets chaotic."],
  ["Newtown gig", "Find a tiny Newtown gig and call it a proper plan."],
  ["beach day", "Lock in a beach day before everyone disappears into assignments."],
  ["campus market", "Do a quick campus-market lap between lectures."],
] as const;

export function generateSuggestionCards(friends: IdeaFriend[], now = new Date()) {
  return friends
    .map((friend, index) => {
      const cadence = friend.stayInTouchDays ?? defaultStayInTouchDays(friend.closeness);
      const days = friend.lastContactedAt
        ? Math.floor((now.getTime() - friend.lastContactedAt.getTime()) / 86_400_000)
        : cadence + 1;
      const [template, detail] = templates[(index + friend.closeness) % templates.length];
      const sharedThing = friend.societies[0]?.society.name ?? friend.interests[0]?.interest.name;
      return {
        friendId: friend.id,
        title: `${friend.preferredName} + ${template} 🍻`,
        detail: sharedThing ? `${detail} You both have ${sharedThing} in the orbit.` : detail,
        template,
        score: (days > cadence ? 100 : 0) + friend.closeness * 10 + days,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ friendId, title, detail, template }) => ({ friendId, title, detail, template }));
}
