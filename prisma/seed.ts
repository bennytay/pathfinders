import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date("2026-09-11T18:00:00+10:00");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

const people = [
  { preferredName: "Maya", nickname: "May", pronouns: "she/her", howWeMet: "tutorial", university: "UNSW", campus: "Kensington", faculty: "Engineering", degreeProgram: "Computer Science", yearOfStudy: "2", societies: ["CSESoc", "DevSoc"], interests: ["matcha", "indie gigs"], closeness: 5, crush: "none", myIntent: "friend", lastContactedAt: daysAgo(25), lastSeenInPersonAt: daysAgo(25) },
  { preferredName: "Lachie", pronouns: "he/him", howWeMet: "college", university: "UNSW", campus: "Kensington", faculty: "Commerce", degreeProgram: "Commerce / Information Systems", yearOfStudy: "3", societies: ["Unibros", "CSESoc"], interests: ["footy", "pub trivia"], closeness: 4, crush: "none", myIntent: "friend", lastContactedAt: daysAgo(7), lastSeenInPersonAt: daysAgo(12) },
  { preferredName: "Zara", nickname: "Z", pronouns: "she/they", howWeMet: "society", university: "UNSW", campus: "Kensington", faculty: "Arts, Design & Architecture", degreeProgram: "Media Arts", yearOfStudy: "2", societies: ["Arc", "UNSW Film Society"], interests: ["film", "thrifting"], closeness: 3, crush: "crush", crushIntensity: 4, myIntent: "date", lastContactedAt: daysAgo(49), lastSeenInPersonAt: daysAgo(51) },
  { preferredName: "Ari", pronouns: "they/them", howWeMet: "party", university: "UNSW", campus: "Kensington", faculty: "Engineering", degreeProgram: "Mechanical Engineering", yearOfStudy: "4", societies: ["EngSoc", "Sunswift"], interests: ["bouldering", "house music"], closeness: 4, crush: "none", myIntent: "friend", lastContactedAt: daysAgo(30), lastSeenInPersonAt: daysAgo(33) },
  { preferredName: "Ethan", pronouns: "he/him", howWeMet: "lecture", university: "UNSW", campus: "Kensington", faculty: "Law & Justice", degreeProgram: "Law / Arts", yearOfStudy: "3", societies: ["LawSoc", "Debating Society"], interests: ["bad movies", "yapping"], closeness: 2, crush: "none", myIntent: "friend", lastContactedAt: daysAgo(94), lastSeenInPersonAt: daysAgo(122) },
  { preferredName: "Nia", pronouns: "she/her", howWeMet: "mutual_friend", university: "UNSW", campus: "Randwick", faculty: "Medicine & Health", degreeProgram: "Exercise Physiology", yearOfStudy: "2", societies: ["MedSoc", "Run Club"], interests: ["beach swims", "pilates"], closeness: 3, crush: "dating", crushIntensity: 3, myIntent: "date", lastContactedAt: daysAgo(16), lastSeenInPersonAt: daysAgo(18) },
  { preferredName: "Jonah", nickname: "Jo", pronouns: "he/him", howWeMet: "work", university: "UNSW", campus: "Kensington", faculty: "Science", degreeProgram: "Advanced Mathematics", yearOfStudy: "honours", societies: ["MathSoc", "CSESoc"], interests: ["chess", "ramen"], closeness: 2, crush: "none", myIntent: "friend", lastContactedAt: daysAgo(8), lastSeenInPersonAt: daysAgo(60) },
  { preferredName: "Sophie", pronouns: "she/her", howWeMet: "dating_app", university: "USYD", campus: "Camperdown", faculty: "Arts", degreeProgram: "Psychology", yearOfStudy: "3", societies: ["SUDS", "Photography Society"], interests: ["photography", "Newtown gigs"], closeness: 3, crush: "past", myIntent: "unclear", lastContactedAt: daysAgo(52), lastSeenInPersonAt: daysAgo(74) },
];

async function main() {
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.contactPoint.deleteMany();
  await prisma.friendInterest.deleteMany();
  await prisma.friendSociety.deleteMany();
  await prisma.friendCourse.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.society.deleteMany();
  await prisma.course.deleteMany();

  const friends: { id: string }[] = [];
  for (const person of people) {
    const { societies, interests, ...friendData } = person;
    const friend = await prisma.friend.create({
      data: {
        ...friendData,
        relationshipStatus: "unknown",
        openTo: "unknown",
        residential: "none",
        usuallySeeThem: "campus",
        societies: {
          create: societies.map((name) => ({
            society: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
        interests: {
          create: interests.map((name) => ({
            interest: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
        contactPoints: { create: [{ kind: "instagram", value: `@${person.preferredName.toLowerCase()}_irl`, label: "insta" }] },
      },
    });
    friends.push(friend);
  }

  const eventData = [
    [1, "in_person", "coffee", "Library latte escape", "Law Library cafe", [0, 2], 4],
    [3, "in_person", "drinks", "Golden Sheaf pre-drinks", "Double Bay", [0, 1, 3], 5],
    [7, "class", "lecture_or_tute", "COMP2521 tute survival", "K17", [0, 6], 3],
    [12, "social", "society_event", "CSESoc speed friending", "Roundhouse", [0, 1, 6], 4],
    [16, "in_person", "beach", "Coogee almost-summer day", "Coogee Beach", [3, 5], 5],
    [18, "text", null, "voice notes about nothing", null, [5], 4],
    [22, "in_person", "study", "All-nighter but make it social", "Main Library", [0, 4, 6], 3],
    [25, "in_person", "dinner", "Maya's dumpling mission", "Kingsford", [0], 5],
    [30, "in_person", "party", "Redfern house chaos", "Redfern", [1, 3, 4], 5],
    [33, "in_person", "sport", "Bouldering era began", "The Ledge", [3], 4],
    [49, "in_person", "concert", "Tiny gig in Newtown", "The Vanguard", [2, 7], 5],
    [52, "text", null, "post-gig debrief", null, [7], 4],
    [60, "class", "lecture_or_tute", "maths lecture side quests", "Red Centre", [6], 3],
    [74, "in_person", "coffee", "slow coffee catch-up", "Camperdown", [7], 4],
    [94, "social", "society_event", "LawSoc bar night", "The Roundhouse", [4], 3],
  ] as const;

  for (const [days, channel, hangoutType, title, location, attendees, vibe] of eventData) {
    await prisma.event.create({
      data: {
        happenedAt: daysAgo(days), channel, hangoutType, title, location, vibe,
        attendees: { create: attendees.map((index) => ({ friendId: friends[index].id })) },
      },
    });
  }
  console.log(`Seeded ${friends.length} people and ${eventData.length} nights ✨`);
}

main().finally(() => prisma.$disconnect());
