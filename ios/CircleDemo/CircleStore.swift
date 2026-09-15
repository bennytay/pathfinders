import Foundation
import Combine

final class CircleStore: ObservableObject {
    @Published var friends: [Friend] = CircleStore.demoFriends
    @Published var hangouts: [Hangout] = []
    @Published var momentFound = false
    @Published var isScanning = false
    @Published var savedNote = "Maya mentioned trying bouldering next week."
    @Published var toast: String?
    @Published var plan: DraftPlan?

    var maya: Friend { friends[0] }

    func scanForMoment() {
        isScanning = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.15) { [weak self] in
            self?.isScanning = false
            self?.momentFound = true
        }
    }

    func keepMoment() {
        hangouts.insert(Hangout(friend: maya, date: .now, place: "Newtown"), at: 0)
        momentFound = false
        showToast("Moment saved privately.")
    }

    func saveVoiceNote() {
        savedNote = "Maya’s free next week. Try the beginner bouldering session in Newtown."
        showToast("Your note stays on this iPhone.")
    }

    func savePlan(_ draft: DraftPlan) {
        plan = draft
        showToast("Plan saved as a private draft.")
    }

    func resetDemo() {
        friends = Self.demoFriends
        hangouts = []
        momentFound = false
        isScanning = false
        savedNote = "Maya mentioned trying bouldering next week."
        plan = nil
        showToast("Demo reset.")
    }

    func showToast(_ message: String) {
        toast = message
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.6) { [weak self] in
            self?.toast = nil
        }
    }

    static let demoFriends = [
        Friend(id: UUID(), name: "Maya Chen", colorName: "rose", context: ["Wants to try bouldering next week", "Just started an internship"], lastSeen: "Seen 12 days ago"),
        Friend(id: UUID(), name: "Ari Singh", colorName: "mint", context: ["Likes a low-key Sunday walk", "New pottery class"], lastSeen: "Seen 2 weeks ago"),
        Friend(id: UUID(), name: "Jess Park", colorName: "peach", context: ["Back from Melbourne soon"], lastSeen: "Seen last month")
    ]
}
