import Foundation
import Combine
import Photos
import PhotosUI

final class CircleStore: ObservableObject {
    @Published var friends: [Friend] = CircleStore.demoFriends
    @Published var hangouts: [Hangout] = []
    @Published var momentFound = false
    @Published var isScanning = false
    @Published var savedNote = "Maya mentioned trying bouldering next week."
    @Published var toast: String?
    @Published var plan: DraftPlan?
    @Published var recentPhotoCount = 0
    @Published var importedPhotoCount = 0

    var maya: Friend { friends[0] }

    func scanForMoment() {
        isScanning = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.15) { [weak self] in
            self?.isScanning = false
            self?.momentFound = true
        }
    }

    func scanPhotoLibrary() {
        guard !isScanning else { return }
        isScanning = true
        PHPhotoLibrary.requestAuthorization(for: .readWrite) { [weak self] status in
            DispatchQueue.main.async {
                guard let self else { return }
                guard status == .authorized || status == .limited else {
                    self.isScanning = false
                    self.showToast("Photo access is needed to check recent photos.")
                    return
                }
                let options = PHFetchOptions()
                options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
                options.fetchLimit = 24
                self.recentPhotoCount = PHAsset.fetchAssets(with: .image, options: options).count
                self.isScanning = false
            }
        }
    }

    @MainActor
    func importPhotos(_ items: [PhotosPickerItem]) async {
        var imported = 0
        for item in items {
            if let _ = try? await item.loadTransferable(type: Data.self) { imported += 1 }
        }
        guard imported > 0 else { return }
        importedPhotoCount += imported
        showToast("\(imported) photo\(imported == 1 ? "" : "s") added locally.")
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
        recentPhotoCount = 0
        importedPhotoCount = 0
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
