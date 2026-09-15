import Foundation

struct Friend: Identifiable, Hashable {
    let id: UUID
    let name: String
    let colorName: String
    var context: [String]
    var lastSeen: String

    var firstName: String { name.split(separator: " ").first.map(String.init) ?? name }
    var initials: String { name.split(separator: " ").compactMap { $0.first }.map(String.init).joined() }
}

struct Hangout: Identifiable {
    let id = UUID()
    let friend: Friend
    let date: Date
    let place: String
}

struct DraftPlan {
    var time = "Saturday afternoon"
    var activity = "Beginner bouldering"
    var place = "The Climbing Lab, Newtown"
}
