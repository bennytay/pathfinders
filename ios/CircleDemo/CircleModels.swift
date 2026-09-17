import Foundation
import SwiftUI

struct Friend: Identifiable, Hashable {
    let id: String
    let displayName: String
    let interest: String
    let imageName: String

    var firstName: String { displayName.split(separator: " ").first.map(String.init) ?? displayName }
    var initials: String { displayName.split(separator: " ").compactMap { $0.first }.map(String.init).joined() }
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

struct Activity: Identifiable {
    let id: String
    let title: String
    let details: String
    let location: String
    let tags: [String]
}
