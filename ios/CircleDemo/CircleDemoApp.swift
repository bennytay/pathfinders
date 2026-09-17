import SwiftUI

@main
struct CircleDemoApp: App {
    @StateObject private var store = CircleStore()

    var body: some Scene {
        WindowGroup {
            CircleRootView()
                .environmentObject(store)
                .tint(CirclePalette.violet)
        }
    }
}
