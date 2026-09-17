import Foundation
import Combine

enum CaptureStage {
    case gate
    case scanning
    case reel
}

/// Synthetic, in-memory fixture data ported 1:1 from lib/fixtures.ts and
/// components/event-feed.tsx. No network access, no Photos/Speech frameworks.
final class CircleStore: ObservableObject {
    @Published var stage: CaptureStage = .gate
    /// Personal, hand-written notes per friend — yours, not generated.
    @Published var personalNotes: [String: String] = CircleStore.demoPersonalNotes

    let friends: [Friend] = CircleStore.demoFriends
    let activities: [Activity] = CircleStore.demoActivities
    let calendarEvents: [CalendarEvent] = CircleStore.demoCalendarEvents
    let highlights: [Highlight] = CircleStore.demoHighlights

    func startScan() {
        guard stage == .gate else { return }
        runScan()
    }

    func rescan() {
        runScan()
    }

    private func runScan() {
        stage = .scanning
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) { [weak self] in
            self?.stage = .reel
        }
    }

    func reset() {
        stage = .gate
    }

    func friendName(_ id: String) -> String {
        friends.first { $0.id == id }?.displayName ?? ""
    }

    /// Activities spanning a friend's interest cluster, ranked by how many
    /// interests each one satisfies, falling back to a general sample so the
    /// detail sheet is never empty.
    func matchingActivities(for friend: Friend) -> [Activity] {
        let matches = activities
            .filter { tagsOverlap($0.tags, friend.interests) }
            .sorted { lhs, rhs in
                matchScore(lhs, friend) > matchScore(rhs, friend)
            }
        return Array((matches.isEmpty ? activities : matches).prefix(8))
    }

    func matchReason(for activity: Activity, friend: Friend) -> String? {
        matchedInterest(tags: activity.tags, interests: friend.interests)
    }

    private func matchScore(_ activity: Activity, _ friend: Friend) -> Int {
        activity.tags.filter { tag in
            friend.interests.contains { $0.lowercased() == tag.lowercased() || $0.lowercased().contains(tag.lowercased()) || tag.lowercased().contains($0.lowercased()) }
        }.count
    }

    static let demoFriends: [Friend] = [
        Friend(id: "priya-shah", displayName: "Priya Shah", interests: ["bouldering", "climbing", "running", "movement"], personality: "Adventurous and always up for something physical and spontaneous.", imageName: "priya-shah"),
        Friend(id: "hana-kim", displayName: "Hana Kim", interests: ["ceramics", "clay", "art", "market"], personality: "A hands-on maker who loves slow, tactile creativity.", imageName: "hana-kim"),
        Friend(id: "arjun-patel", displayName: "Arjun Patel", interests: ["live music", "jazz", "music", "dance"], personality: "Can't sit still when there's a beat, always first on the dance floor.", imageName: "arjun-patel"),
        Friend(id: "rohan-mehta", displayName: "Rohan Mehta", interests: ["film", "cinema", "food", "dinner"], personality: "A dinner-and-a-movie type who always picks the restaurant.", imageName: "rohan-mehta"),
        Friend(id: "isla-morgan", displayName: "Isla Morgan", interests: ["running", "movement", "dance", "bouldering"], personality: "Chases sunrise workouts and new movement classes.", imageName: "isla-morgan"),
        Friend(id: "haru-sato", displayName: "Haru Sato", interests: ["vintage", "market", "art", "books"], personality: "Always hunting for one-of-a-kind finds and forgotten aesthetics.", imageName: "haru-sato"),
        Friend(id: "tyler-woodward", displayName: "Tyler Woodward", interests: ["drawing", "art", "books", "reading"], personality: "Sketchbook always in hand, always down for a quiet afternoon with a book.", imageName: "tyler-woodward"),
        Friend(id: "yingying-zhang", displayName: "Yingying Zhang", interests: ["books", "reading", "music", "live music"], personality: "Recommends a book and a playlist for every mood.", imageName: "yingying-zhang"),
    ]

    static let demoPersonalNotes: [String: String] = [
        "priya-shah": "Owes me a rematch at the bouldering gym.",
        "hana-kim": "Made the little blue mug I use every morning.",
        "arjun-patel": "Always knows where the after-party is.",
        "rohan-mehta": "Still owes me a taco truck recommendation.",
        "isla-morgan": "Down for a 6am run, no questions asked.",
        "haru-sato": "Found me that thrifted jacket I love.",
        "tyler-woodward": "Drew a tiny portrait of my dog once.",
        "yingying-zhang": "Lent me three books I still haven't returned.",
    ]

    static let demoActivities: [Activity] = [
        Activity(id: "beginner-bouldering", title: "Beginner bouldering", details: "Wed, 6:30pm", location: "The Bouldering Project", tags: ["bouldering", "climbing"]),
        Activity(id: "clay-social", title: "Clay social", details: "Thu, 7pm", location: "Kil.n Studio", tags: ["ceramics", "clay"]),
        Activity(id: "harbour-jazz", title: "Harbour jazz club", details: "Thu, 8pm", location: "The Vanguard", tags: ["live music", "jazz"]),
        Activity(id: "rooftop-cinema", title: "Rooftop cinema", details: "Fri, 7:15pm", location: "Golden Age", tags: ["film", "cinema"]),
        Activity(id: "run-club", title: "Run club to happy hour", details: "Sat, 9am", location: "Darling Harbour", tags: ["running", "run"]),
        Activity(id: "vintage-market", title: "Sunday vintage market", details: "Sun, 10am", location: "Carriageworks", tags: ["vintage", "market"]),
        Activity(id: "figure-drawing", title: "Figure drawing night", details: "Sun, 6pm", location: "The Studio", tags: ["drawing", "art"]),
        Activity(id: "silent-reading", title: "Silent reading hour", details: "Mon, 6pm", location: "Sappho Books", tags: ["books", "reading"]),
        Activity(id: "warehouse-dance", title: "Warehouse dance class", details: "Mon, 7:30pm", location: "Red Rattler", tags: ["dance", "movement"]),
        Activity(id: "night-market", title: "Night noodle market", details: "Tue, 6pm", location: "Haymarket", tags: ["food", "dinner"]),
        Activity(id: "open-mic", title: "Open mic at the pub", details: "Tue, 8pm", location: "The Bearded Tit", tags: ["live music", "music"]),
        Activity(id: "morning-swim", title: "Early ocean swim", details: "Wed, 7am", location: "Bondi Icebergs", tags: ["running", "movement"]),
        Activity(id: "zine-fair", title: "Small press zine fair", details: "Sat, 11am", location: "UTS Gallery", tags: ["drawing", "books"]),
        Activity(id: "pasta-club", title: "Pasta club", details: "Sat, 7pm", location: "Pellegrino 2000", tags: ["food", "dinner"]),
        Activity(id: "foreign-film", title: "Foreign film night", details: "Sun, 5pm", location: "Chauvel Cinema", tags: ["film", "cinema"]),
        Activity(id: "record-fair", title: "Record fair", details: "Sun, 12pm", location: "Oxford Art Factory", tags: ["live music", "music"]),
        Activity(id: "park-pilates", title: "Park pilates", details: "Next Mon, 6pm", location: "Victoria Park", tags: ["dance", "movement"]),
        Activity(id: "book-launch", title: "Book launch and drinks", details: "Next Tue, 7pm", location: "Gleebooks", tags: ["books", "reading"]),
    ]

    static let demoCalendarEvents: [CalendarEvent] = [
        CalendarEvent(title: "Studio stand-up", day: 0, start: 1, duration: 1, tone: .blue),
        CalendarEvent(title: "Lunch with Priya", day: 1, start: 3, duration: 1, tone: .rose),
        CalendarEvent(title: "Run club", day: 2, start: 8, duration: 2, tone: .violet),
        CalendarEvent(title: "Dinner at 6", day: 3, start: 9, duration: 2, tone: .orange),
        CalendarEvent(title: "Design review", day: 4, start: 2, duration: 2, tone: .green),
        CalendarEvent(title: "Open studio", day: 5, start: 5, duration: 2, tone: .blue),
        CalendarEvent(title: "Beach walk", day: 6, start: 3, duration: 2, tone: .rose),
    ]

    static let demoHighlights: [Highlight] = [
        Highlight(id: "scan-basketball-priya", imageName: "sunset-basketball", caption: "One more game before the sun went down.", place: "The Courts", capturedAt: isoDate("2026-09-06T18:30:00.000Z"), friendIds: ["priya-shah"]),
        Highlight(id: "scan-cafe-hana", imageName: "cafe-night", caption: "Coffee that turned into two hours of nothing important.", place: "The Corner Cafe", capturedAt: isoDate("2026-09-07T20:00:00.000Z"), friendIds: ["hana-kim"]),
        Highlight(id: "scan-dance-arjun", imageName: "birthday-dance", caption: "First one on the dance floor, as usual.", place: "The Birthday Party", capturedAt: isoDate("2026-09-08T21:00:00.000Z"), friendIds: ["arjun-patel"]),
        Highlight(id: "scan-lounge-rohan", imageName: "lounge-candles", caption: "Candlelight and a conversation that ran long.", place: "The Lounge", capturedAt: isoDate("2026-09-09T22:00:00.000Z"), friendIds: ["rohan-mehta"]),
        Highlight(id: "scan-soccer-isla", imageName: "beach-soccer", caption: "Kicking the ball around until the light was gone.", place: "The Beach", capturedAt: isoDate("2026-09-10T18:00:00.000Z"), friendIds: ["isla-morgan"]),
        Highlight(id: "scan-postgame-haru", imageName: "postgame", caption: "Still laughing about it outside the bar after.", place: "The Boardwalk Bar", capturedAt: isoDate("2026-09-11T20:30:00.000Z"), friendIds: ["haru-sato"]),
        Highlight(id: "scan-park-tyler", imageName: "central-park", caption: "Flat on our backs, in no rush to leave.", place: "Central Park", capturedAt: isoDate("2026-09-12T14:00:00.000Z"), friendIds: ["tyler-woodward"]),
        Highlight(id: "scan-karting-yingying", imageName: "go-karting", caption: "One more lap before we called it a night.", place: "The Go-Kart Track", capturedAt: isoDate("2026-09-13T16:00:00.000Z"), friendIds: ["yingying-zhang"]),
        Highlight(id: "scan-spikeball-priya-isla", imageName: "spikeball", caption: "Nobody wanted to admit they were losing.", place: "The Park", capturedAt: isoDate("2026-09-13T19:00:00.000Z"), friendIds: ["isla-morgan", "priya-shah"]),
        Highlight(id: "scan-pool-rohan-tyler", imageName: "pool-night", caption: "Down two games, still talking trash.", place: "The Pool Hall", capturedAt: isoDate("2026-09-14T21:30:00.000Z"), friendIds: ["rohan-mehta", "tyler-woodward"]),
    ]
}

private let isoFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
}()

private func isoDate(_ value: String) -> Date {
    isoFormatter.date(from: value) ?? Date()
}
