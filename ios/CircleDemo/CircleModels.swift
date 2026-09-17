import Foundation
import SwiftUI

struct Friend: Identifiable, Hashable {
    let id: String
    let displayName: String
    /// A small cluster of interest tags (drawn from the same vocabulary as
    /// `Activity.tags`) standing in for a richer personality/interest profile,
    /// so matching turns up more than one activity per person.
    let interests: [String]
    /// A one-line personality read, shown alongside the interest cluster —
    /// not used for matching, just texture.
    let personality: String
    let imageName: String

    var firstName: String { displayName.split(separator: " ").first.map(String.init) ?? displayName }
    var initials: String { displayName.split(separator: " ").compactMap { $0.first }.map(String.init).joined() }
    var interestSummary: String { interests.map { $0.capitalized }.joined(separator: " · ") }

    /// Synthetic handles derived from the fixture name, purely for demo "connect" links.
    private var socialHandle: String { displayName.lowercased().replacingOccurrences(of: " ", with: "") }
    var instagramURL: URL { URL(string: "https://instagram.com/\(socialHandle)")! }
    var xURL: URL { URL(string: "https://x.com/\(socialHandle)")! }
    var snapchatURL: URL { URL(string: "https://snapchat.com/add/\(socialHandle)")! }
    var whatsAppURL: URL {
        let seed = id.utf8.reduce(0) { $0 + Int($1) }
        let digits = 2_000_000_000 + (seed * 9_973) % 800_000_000
        return URL(string: "https://wa.me/1\(digits)")!
    }
}

struct Highlight: Identifiable {
    let id: String
    let imageName: String
    let caption: String
    let place: String
    let capturedAt: Date
    let friendIds: [String]
}

enum EventTone {
    case blue, rose, violet, orange, green

    var color: Color {
        switch self {
        case .blue: return CirclePalette.toneBlue
        case .rose: return CirclePalette.toneRose
        case .violet: return CirclePalette.toneViolet
        case .orange: return CirclePalette.toneOrange
        case .green: return CirclePalette.toneGreen
        }
    }
}

struct CalendarEvent: Identifiable {
    let id = UUID()
    let title: String
    let day: Int
    let start: Int
    let duration: Int
    let tone: EventTone
}

enum ActivityCategory: String, CaseIterable {
    case sponsored, sideQuests, afterHours, popupsAndMarkets, moveYourBody

    /// Display order for the Find events page — sponsored always leads.
    static var displayOrder: [ActivityCategory] { [.sponsored, .sideQuests, .afterHours, .popupsAndMarkets, .moveYourBody] }

    var title: String {
        switch self {
        case .sponsored: return "Sponsored"
        case .sideQuests: return "Side quests"
        case .afterHours: return "After hours"
        case .popupsAndMarkets: return "Popups and markets"
        case .moveYourBody: return "Move your body"
        }
    }
}

struct Activity: Identifiable {
    let id: String
    let title: String
    let details: String
    let location: String
    let tags: [String]
    let category: ActivityCategory
}

/// Tolerant, case-insensitive overlap check between an activity's tags and a
/// friend's interest cluster — the shared core of the recommendation "engine"
/// used both to find activities for a friend and friends for an activity.
func tagsOverlap(_ tags: [String], _ interests: [String]) -> Bool {
    tags.contains { tag in
        interests.contains { interest in
            interest.lowercased() == tag.lowercased() ||
            interest.lowercased().contains(tag.lowercased()) ||
            tag.lowercased().contains(interest.lowercased())
        }
    }
}

/// The first interest that explains why an activity was recommended, for
/// display in "why this fits" copy.
func matchedInterest(tags: [String], interests: [String]) -> String? {
    for interest in interests {
        for tag in tags {
            if interest.lowercased() == tag.lowercased() ||
                interest.lowercased().contains(tag.lowercased()) ||
                tag.lowercased().contains(interest.lowercased()) {
                return tag
            }
        }
    }
    return nil
}
