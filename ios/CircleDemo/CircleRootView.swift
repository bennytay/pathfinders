import SwiftUI
import MapKit

enum CircleType {
    /// The rounded system face keeps Circle warm and personable without adding
    /// a font dependency or compromising the iPhone's Dynamic Type support.
    static func display(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }

    static func label(_ size: CGFloat, weight: Font.Weight = .heavy) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

/// A low-light indigo atmosphere behind every non-photographic surface. The
/// fields drift slowly enough to feel ambient, not distracting.
struct CircleAtmosphere: View {
    @State private var drift = false

    var body: some View {
        ZStack {
            CirclePalette.canvas
            LinearGradient(
                colors: [Color(red: 0.024, green: 0.021, blue: 0.052), Color(red: 0.035, green: 0.025, blue: 0.090), CirclePalette.canvas],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Circle()
                .fill(CirclePalette.violet.opacity(0.22))
                .frame(width: 360, height: 360)
                .blur(radius: 96)
                .offset(x: drift ? 155 : 95, y: drift ? -270 : -220)
            Circle()
                .fill(Color(red: 0.08, green: 0.36, blue: 0.54).opacity(0.18))
                .frame(width: 310, height: 310)
                .blur(radius: 104)
                .offset(x: drift ? -145 : -85, y: drift ? 345 : 285)
            Circle()
                .fill(CirclePalette.mint.opacity(0.09))
                .frame(width: 220, height: 220)
                .blur(radius: 84)
                .offset(x: drift ? 65 : 20, y: drift ? 210 : 155)
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .onAppear {
            withAnimation(.easeInOut(duration: 13).repeatForever(autoreverses: true)) {
                drift = true
            }
        }
    }
}

struct CircleRootView: View {
    @State private var selectedTab: CircleTab = .plan

    var body: some View {
        ZStack(alignment: .bottom) {
            CircleAtmosphere()
            selectedContent
                // Reserve room for the floating bar without making it part of
                // the destination's hit-test hierarchy.
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    Color.clear
                        .frame(height: 76)
                        .allowsHitTesting(false)
                }

            LiquidGlassNavigation(selection: $selectedTab)
                .padding(.horizontal, 18)
                .padding(.bottom, 6)
                .zIndex(1)
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    private var selectedContent: some View {
        switch selectedTab {
        case .map:
            MapView()
        case .plan:
            PlanView()
        case .capture:
            CaptureView()
        case .people:
            PeopleView()
        }
    }
}

private enum CircleTab: CaseIterable, Hashable {
    case map, plan, capture, people

    var title: String {
        switch self {
        case .map: return "Map"
        case .plan: return "Plan"
        case .capture: return "Capture"
        case .people: return "People"
        }
    }

    var symbol: String {
        switch self {
        case .map: return "map.fill"
        case .plan: return "calendar"
        case .capture: return "sparkles"
        case .people: return "person.2"
        }
    }
}

/// This is a deliberately self-contained glass treatment. It has a translucent
/// tint and a light-catching edge, but does not ask MapKit or the system tab
/// bar to provide a second material backdrop.
private struct LiquidGlassNavigation: View {
    @Binding var selection: CircleTab

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                navigationContent
                    .glassEffect(.regular, in: Capsule(style: .continuous))
            } else {
                navigationContent
                    .background {
                        Capsule(style: .continuous)
                            .fill(CirclePalette.paper.opacity(0.88))
                            .overlay {
                                LinearGradient(
                                    colors: [
                                        CirclePalette.ink.opacity(0.15),
                                        CirclePalette.violet.opacity(0.08),
                                        CirclePalette.canvas.opacity(0.18)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                                .clipShape(Capsule(style: .continuous))
                            }
                    }
                    .overlay {
                        Capsule(style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [CirclePalette.ink.opacity(0.38), CirclePalette.ink.opacity(0.08)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    }
            }
        }
        .shadow(color: CirclePalette.canvas.opacity(0.42), radius: 12, y: 5)
    }

    private var navigationContent: some View {
        HStack(spacing: 4) {
            ForEach(CircleTab.allCases, id: \.self) { tab in
                Button {
                    withAnimation(.easeOut(duration: 0.2)) {
                        selection = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.symbol)
                            .font(.system(size: 16, weight: .semibold))
                        Text(tab.title)
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                    }
                    .foregroundStyle(selection == tab ? CirclePalette.canvas : CirclePalette.ink.opacity(0.74))
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .contentShape(Rectangle())
                    .background {
                        if selection == tab {
                            selectedTabSurface
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(selection == tab ? .isSelected : [])
            }
        }
        .padding(5)
        .contentShape(Capsule(style: .continuous))
        .allowsHitTesting(true)
    }

    @ViewBuilder
    private var selectedTabSurface: some View {
        if #available(iOS 26.0, *) {
            Capsule(style: .continuous)
                .fill(.clear)
                .glassEffect(.regular.tint(CirclePalette.violet), in: Capsule(style: .continuous))
        } else {
            Capsule(style: .continuous)
                .fill(CirclePalette.violet)
                .shadow(color: CirclePalette.violet.opacity(0.30), radius: 10, y: 3)
        }
    }
}

// MARK: - Shared header

struct CircleHeader: View {
    @EnvironmentObject private var store: CircleStore

    var body: some View {
        HStack {
            ProfileMenuButton()
            Text("circle")
                .foregroundStyle(CirclePalette.ink)
                .font(CircleType.display(22, weight: .heavy))
                .tracking(-0.4)
                .onLongPressGesture(minimumDuration: 0.6) {
                    store.reset()
                }
            Spacer()
        }
        .padding(.top, 4)
    }
}

/// A quiet identity marker that keeps the map and reel personal without
/// turning the avatar into another settings destination.
struct ProfileMenuButton: View {
    @EnvironmentObject private var store: CircleStore

    var body: some View {
        Image(store.profileImageName)
            .resizable()
            .scaledToFill()
            .frame(width: 42, height: 42)
            .clipShape(Circle())
            .overlay(Circle().stroke(CirclePalette.violetDeep, lineWidth: 2))
            .shadow(color: .black.opacity(0.28), radius: 5, y: 2)
            .accessibilityHidden(true)
    }
}

struct ProfileEditor: View {
    @EnvironmentObject private var store: CircleStore
    @Environment(\.dismiss) private var dismiss
    private let profileImages = ["isla-morgan", "priya-shah", "hana-kim", "arjun-patel", "rohan-mehta"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    VStack(spacing: 10) {
                        Image(store.profileImageName)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 104, height: 104)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(CirclePalette.violet, lineWidth: 3))

                        Text("Choose a profile photo")
                            .font(CircleType.display(15, weight: .bold))
                            .foregroundStyle(CirclePalette.ink)

                        HStack(spacing: 12) {
                            ForEach(profileImages, id: \.self) { imageName in
                                Button { store.profileImageName = imageName } label: {
                                    Image(imageName)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 48, height: 48)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(imageName == store.profileImageName ? CirclePalette.violet : CirclePalette.line, lineWidth: imageName == store.profileImageName ? 3 : 1))
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Use this profile photo")
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)

                    profileField("Name", text: $store.profileName, prompt: "Your name")
                    profileField("Your neighbourhood", text: $store.profileNeighbourhood, prompt: "Suburb, city")

                    VStack(alignment: .leading, spacing: 8) {
                        Text("A little about you")
                            .font(CircleType.display(15, weight: .bold))
                            .foregroundStyle(CirclePalette.ink)
                        TextField("What kinds of plans do you love?", text: $store.profileBio, axis: .vertical)
                            .lineLimit(3...5)
                            .font(.system(size: 15))
                            .foregroundStyle(CirclePalette.ink)
                            .padding(14)
                            .background(CirclePalette.paper, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 15, style: .continuous).stroke(CirclePalette.line, lineWidth: 1))
                    }

                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "lock.fill")
                            .foregroundStyle(CirclePalette.mint)
                        Text("These details stay on this device. Circle only uses them to make local suggestions feel more like you.")
                            .font(.system(size: 12))
                            .foregroundStyle(CirclePalette.muted)
                    }
                    .padding(14)
                    .background(CirclePalette.violetSoft, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                }
                .padding(20)
                .padding(.bottom, 30)
            }
            .background(CircleAtmosphere())
            .navigationTitle("Your profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .font(CircleType.display(15, weight: .bold))
                        .foregroundStyle(CirclePalette.violetDeep)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func profileField(_ label: String, text: Binding<String>, prompt: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(CircleType.display(15, weight: .bold))
                .foregroundStyle(CirclePalette.ink)
            TextField(prompt, text: text)
                .font(.system(size: 15))
                .foregroundStyle(CirclePalette.ink)
                .padding(14)
                .background(CirclePalette.paper, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 15, style: .continuous).stroke(CirclePalette.line, lineWidth: 1))
        }
    }
}

struct Eyebrow: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(CircleType.label(10))
            .tracking(0.7)
            .foregroundStyle(CirclePalette.violetDeep)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(CircleType.label(13, weight: .bold))
            .padding(.vertical, 14)
            .foregroundStyle(CirclePalette.canvas)
            .background(CirclePalette.violet.opacity(configuration.isPressed ? 0.8 : 1), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

// MARK: - Plan tab

struct MapView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var selectedCluster: MapCluster?
    @State private var cameraPosition = MapCameraPosition.region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: -33.8890, longitude: 151.2120),
            span: MKCoordinateSpan(latitudeDelta: 0.050, longitudeDelta: 0.055)
        )
    )

    private let homeCoordinate = CLLocationCoordinate2D(latitude: -33.8845, longitude: 151.2110)

    var body: some View {
        ZStack(alignment: .bottom) {
            Map(position: $cameraPosition, interactionModes: .all) {
                Annotation("You are here", coordinate: homeCoordinate, anchor: .center) {
                    ZStack {
                        Circle().fill(CirclePalette.violet.opacity(0.20)).frame(width: 54, height: 54)
                        Circle().fill(CirclePalette.violet).frame(width: 30, height: 30)
                        Image(systemName: "location.fill")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(CirclePalette.canvas)
                    }
                    .accessibilityLabel("You are here, Surry Hills")
                }

                ForEach(store.mapClusters) { cluster in
                    Annotation(cluster.name, coordinate: cluster.coordinate, anchor: .bottom) {
                        Button {
                            withAnimation(.easeOut(duration: 0.2)) {
                                selectedCluster = cluster
                            }
                        } label: {
                            MapClusterMarker(
                                symbol: symbol(for: cluster),
                                count: cluster.activityIDs.count,
                                isSelected: selectedCluster?.id == cluster.id
                            )
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(cluster.activityIDs.count) nearby plans in \(cluster.name)")
                    }
                }
            }
            .mapStyle(.standard(elevation: .flat, emphasis: .muted, pointsOfInterest: .excludingAll))
            .preferredColorScheme(.light)
            .ignoresSafeArea(edges: [.top, .horizontal])

            VStack(spacing: 12) {
                HStack(spacing: 10) {
                    ProfileMenuButton()
                    VStack(alignment: .leading, spacing: 1) {
                        Text("NEAR YOU")
                            .font(CircleType.label(9))
                            .tracking(0.8)
                            .foregroundStyle(CirclePalette.violetDeep)
                        Text(store.profileNeighbourhood)
                            .font(CircleType.display(14, weight: .bold))
                            .foregroundStyle(CirclePalette.ink)
                    }
                    Spacer()
                    Button {
                        withAnimation(.easeOut(duration: 0.25)) {
                            cameraPosition = .region(MKCoordinateRegion(
                                center: homeCoordinate,
                                span: MKCoordinateSpan(latitudeDelta: 0.032, longitudeDelta: 0.036)
                            ))
                        }
                    } label: {
                        Image(systemName: "location.fill")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(CirclePalette.ink)
                            .frame(width: 42, height: 42)
                            .background(CirclePalette.paper, in: Circle())
                    }
                    .accessibilityLabel("Centre map on your location")
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .frame(maxHeight: .infinity, alignment: .top)

        }
        .sheet(item: $selectedCluster) { cluster in
            ClusterEventsPopup(cluster: cluster)
                .presentationDetents([.height(365)])
                .presentationDragIndicator(.visible)
                .presentationCornerRadius(28)
                .presentationBackground(CirclePalette.canvas)
        }
    }

    private func symbol(for cluster: MapCluster) -> String {
        guard let id = cluster.activityIDs.first,
              let activity = store.activities.first(where: { $0.id == id }) else { return "sparkles" }
        return activity.mapSymbol
    }
}

/// A pin opens this compact, transient list instead of restoring a persistent
/// events panel over the map.
struct ClusterEventsPopup: View {
    @EnvironmentObject private var store: CircleStore
    let cluster: MapCluster

    private var activities: [Activity] {
        cluster.activityIDs.compactMap { id in
            store.activities.first { $0.id == id }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Eyebrow("NEAR \(cluster.name.uppercased())")
                Text("Plans in \(cluster.name)")
                    .font(CircleType.display(23, weight: .heavy))
                    .foregroundStyle(CirclePalette.ink)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 14) {
                    ForEach(activities) { activity in
                        ActivityCard(activity: activity, friends: fittingFriends(for: activity))
                            .frame(width: 178, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.vertical, 2)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 20)
    }

    private func fittingFriends(for activity: Activity) -> [Friend] {
        let matches = store.friends.filter { tagsOverlap(activity.tags, $0.interests) }
        return Array((matches.isEmpty ? store.friends : matches).prefix(3))
    }
}

struct PlanView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var selectedActivity: Activity?

    private var firstName: String {
        store.profileName.split(separator: " ").first.map(String.init) ?? "Benjamin"
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                CircleHeader()

                VStack(alignment: .leading, spacing: 6) {
                    Text("Hi \(firstName)")
                        .font(CircleType.display(32, weight: .heavy))
                        .tracking(-0.45)
                        .foregroundStyle(CirclePalette.ink)
                    Text("Your week, with room for something good.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(CirclePalette.muted)
                }

                MiniCalendarView(events: store.calendarEvents)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Hangout plans")
                        .font(CircleType.display(21, weight: .bold))
                        .foregroundStyle(CirclePalette.ink)
                    Text("Ideas worth making time for")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(CirclePalette.muted)
                }

                ForEach(ActivityCategory.displayOrder, id: \.self) { category in
                    let activities = store.activities.filter { $0.category == category }
                    if !activities.isEmpty {
                        VStack(alignment: .leading, spacing: 14) {
                            Text(category.title)
                                .font(CircleType.label(13))
                                .tracking(0.4)
                                .foregroundStyle(category == .sponsored ? CirclePalette.peach : CirclePalette.violetDeep)

                            LazyVGrid(
                                columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)],
                                spacing: 20
                            ) {
                                ForEach(activities) { activity in
                                    Button { selectedActivity = activity } label: {
                                        ActivityCard(activity: activity, friends: fittingFriends(for: activity))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 26)
        }
        .background(CircleAtmosphere())
        .fullScreenCover(item: $selectedActivity) { activity in
            EventDetailSheet(activity: activity, friends: fittingFriends(for: activity))
        }
    }

    private func fittingFriends(for activity: Activity) -> [Friend] {
        let matches = store.friends.filter { tagsOverlap(activity.tags, $0.interests) }
        return Array((matches.isEmpty ? store.friends : matches).prefix(3))
    }
}

struct MapClusterMarker: View {
    let symbol: String
    let count: Int
    let isSelected: Bool

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(systemName: symbol)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(isSelected ? CirclePalette.canvas : CirclePalette.ink)
                .frame(width: 44, height: 44)
                .background(isSelected ? CirclePalette.violet : CirclePalette.paper, in: Circle())
                .overlay(Circle().stroke(CirclePalette.canvas.opacity(0.82), lineWidth: 2))
                .shadow(color: .black.opacity(0.25), radius: 6, y: 3)
            Text("\(count)")
                .font(.system(size: 10, weight: .heavy, design: .rounded))
                .foregroundStyle(CirclePalette.canvas)
                .frame(width: 20, height: 20)
                .background(CirclePalette.peach, in: Circle())
                .overlay(Circle().stroke(CirclePalette.canvas, lineWidth: 1.5))
                .offset(x: 5, y: -5)
        }
    }
}

struct MiniCalendarView: View {
    let events: [CalendarEvent]

    private let dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    private let dayNumbers = [16, 17, 18, 19, 20, 21, 22]
    private let hourLabels = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6", "7", "8"]
    private let rowHeight: CGFloat = 26
    private let colWidth: CGFloat = 42
    private let gutter: CGFloat = 22

    private var gridHeight: CGFloat { rowHeight * CGFloat(hourLabels.count) }
    private var gridWidth: CGFloat { colWidth * 7 }

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 0) {
                Color.clear.frame(width: gutter)
                ForEach(0..<7, id: \.self) { day in
                    VStack(spacing: 2) {
                        Text(dayLabels[day])
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(CirclePalette.muted)
                        Text("\(dayNumbers[day])")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(day == 2 ? CirclePalette.violetDeep : CirclePalette.ink)
                    }
                    .frame(width: colWidth)
                }
            }
            HStack(alignment: .top, spacing: 0) {
                VStack(spacing: 0) {
                    ForEach(hourLabels, id: \.self) { hour in
                        Text(hour)
                            .font(.system(size: 8))
                            .foregroundStyle(CirclePalette.muted)
                            .frame(width: gutter, height: rowHeight, alignment: .top)
                    }
                }
                ZStack(alignment: .topLeading) {
                    gridLines
                    ForEach(events) { event in
                        EventBlock(event: event)
                            .frame(width: colWidth - 3, height: rowHeight * CGFloat(event.duration) - 3)
                            .offset(x: CGFloat(event.day) * colWidth + 1.5, y: CGFloat(event.start) * rowHeight + 1.5)
                    }
                }
                .frame(width: gridWidth, height: gridHeight, alignment: .topLeading)
            }
        }
        .padding(12)
        .background(CirclePalette.paper, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(CirclePalette.line, lineWidth: 1))
    }

    private var gridLines: some View {
        Canvas { context, size in
            for row in 0...hourLabels.count {
                let y = CGFloat(row) * rowHeight
                var path = Path()
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
                context.stroke(path, with: .color(CirclePalette.line.opacity(0.5)), lineWidth: 1)
            }
            for col in 0...7 {
                let x = CGFloat(col) * colWidth
                var path = Path()
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                context.stroke(path, with: .color(CirclePalette.line.opacity(0.5)), lineWidth: 1)
            }
        }
        .frame(width: gridWidth, height: gridHeight)
    }
}

struct EventBlock: View {
    let event: CalendarEvent

    var body: some View {
        Text(event.title)
            .font(.system(size: 8, weight: .semibold))
            .foregroundStyle(.white)
            .lineLimit(2)
            .padding(3)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(event.tone.color, in: RoundedRectangle(cornerRadius: 4, style: .continuous))
    }
}

struct ActivityCard: View {
    let activity: Activity
    let friends: [Friend]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ZStack(alignment: .topLeading) {
                ActivityArtwork(activity: activity, cornerRadius: 12)
                    .overlay(LinearGradient(colors: [.black.opacity(0.02), .black.opacity(0.5)], startPoint: .top, endPoint: .bottom))

                Text((activity.tags.first ?? "Plan").capitalized)
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 4)
                    .background(.white.opacity(0.9), in: Capsule())
                    .padding(8)

                FriendAvatarStack(friends: friends)
                    .padding(8)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
            }

            Text(activity.title)
                .font(CircleType.display(15, weight: .bold))
                .tracking(-0.1)
                .foregroundStyle(CirclePalette.ink)
                .lineLimit(1)
            Text("\(activity.location) · \(activity.details)")
                .font(.system(size: 11))
                .foregroundStyle(CirclePalette.muted)
                .lineLimit(1)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(activity.title), suggested with \(friends.map(\.firstName).joined(separator: ", "))")
    }
}

/// A compact face stack makes event matches legible without spending another
/// line of card copy. The white rims keep each portrait distinct over imagery.
struct FriendAvatarStack: View {
    let friends: [Friend]

    var body: some View {
        HStack(spacing: -8) {
            ForEach(Array(friends.prefix(3).reversed())) { friend in
                Image(friend.imageName)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 29, height: 29)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(.white.opacity(0.95), lineWidth: 2))
                    .shadow(color: .black.opacity(0.28), radius: 3, y: 1)
                    .accessibilityHidden(true)
            }
        }
    }
}

/// Every event uses the same 4:3 artwork frame. `scaledToFit` deliberately
/// preserves the full image, including portrait source photos, rather than
/// cutting a performer or venue out at the edge of a card.
struct ActivityArtwork: View {
    let activity: Activity
    var cornerRadius: CGFloat = 16

    var body: some View {
        ZStack {
            CirclePalette.paper
            Image(activity.id)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(4.0 / 3.0, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}

// MARK: - Capture tab

struct CaptureView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var showsPhotoAccessPrompt = false

    var body: some View {
        ZStack {
            CircleAtmosphere()

            if store.stage != .reel {
                FloatingSpheresBackground()
                    .ignoresSafeArea()
            }

            switch store.stage {
            case .gate:
                VStack(alignment: .leading, spacing: 20) {
                    Color.clear.frame(height: 44)
                    GateCard(onGiveFullAccess: { showsPhotoAccessPrompt = true })
                    Spacer()
                }
                .padding(.horizontal, 20)
            case .scanning:
                VStack(alignment: .leading, spacing: 20) {
                    Color.clear.frame(height: 44)
                    ScanningCard()
                    Spacer()
                }
                .padding(.horizontal, 20)
            case .reel:
                // The photo is the surface. Controls sit directly on top of it
                // instead of reserving a separate, empty content region.
                HighlightReel()
                    .ignoresSafeArea()
            }

            VStack {
                ZStack(alignment: .top) {
                    Group {
                        if store.stage == .reel {
                            CaptureReelHeader(onRescan: { store.rescan() })
                        } else {
                            CircleHeader()
                        }
                    }
                        .padding(.horizontal, 20)
                        .padding(.top, store.stage == .reel ? 6 : 0)
                }
                Spacer()
            }
        }
        // This is intentionally a demo-only permission affordance. It mimics
        // the system decision without asking Photos.framework for access.
        .alert("Allow \"Circle\" to access your photos?", isPresented: $showsPhotoAccessPrompt) {
            Button("Select Photos…") {}
            Button("Allow Full Access") { store.startScan() }
            Button("Don't Allow", role: .cancel) {}
        } message: {
            Text("Circle uses your library to create a private highlight reel. Photos stay on this device.")
        }
    }
}

struct CaptureReelHeader: View {
    let onRescan: () -> Void

    var body: some View {
        HStack(spacing: 9) {
            ProfileMenuButton()
            Text("circle")
                .foregroundStyle(CirclePalette.ink)
                .font(CircleType.display(22, weight: .heavy))
                .tracking(-0.4)
            Spacer()
            Button(action: onRescan) {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(Color.black.opacity(0.38), in: Circle())
            }
            .accessibilityLabel("Rescan photos")
        }
    }
}

/// A drifting field of flat, crisp-edged circles behind the Capture gate/scan
/// states. TimelineView drives the slow float so it's a live function of elapsed
/// time; each circle also carries its own drag gesture so it can be flicked around.
struct FloatingSpheresBackground: View {
    fileprivate struct SphereSpec: Identifiable {
        let id: Int
        let baseSize: CGFloat
        let color: Color
        let speed: Double
        let radius: CGFloat
        let phaseOffset: Double
        let anchor: UnitPoint
    }

    private let specs: [SphereSpec] = [
        SphereSpec(id: 0, baseSize: 150, color: CirclePalette.violet, speed: 0.22, radius: 28, phaseOffset: 0.0, anchor: UnitPoint(x: 0.2, y: 0.14)),
        SphereSpec(id: 1, baseSize: 84, color: CirclePalette.mint, speed: 0.34, radius: 22, phaseOffset: 1.4, anchor: UnitPoint(x: 0.84, y: 0.2)),
        SphereSpec(id: 2, baseSize: 190, color: CirclePalette.peach, speed: 0.16, radius: 24, phaseOffset: 2.6, anchor: UnitPoint(x: 0.78, y: 0.58)),
        SphereSpec(id: 3, baseSize: 64, color: CirclePalette.violetDeep, speed: 0.4, radius: 18, phaseOffset: 3.8, anchor: UnitPoint(x: 0.16, y: 0.68)),
        SphereSpec(id: 4, baseSize: 112, color: CirclePalette.violet, speed: 0.2, radius: 20, phaseOffset: 5.0, anchor: UnitPoint(x: 0.52, y: 0.4)),
    ]

    var body: some View {
        GeometryReader { proxy in
            TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
                let t = timeline.date.timeIntervalSinceReferenceDate
                ZStack {
                    ForEach(specs) { spec in
                        FloatingSphere(spec: spec, time: t, containerSize: proxy.size)
                    }
                }
            }
        }
        .allowsHitTesting(true)
    }
}

private struct FloatingSphere: View {
    fileprivate typealias SphereSpec = FloatingSpheresBackground.SphereSpec
    let spec: SphereSpec
    let time: TimeInterval
    let containerSize: CGSize

    @GestureState private var dragTranslation: CGSize = .zero
    @State private var settledOffset: CGSize = .zero
    @State private var bump = false

    var body: some View {
        let floatX = cos(time * spec.speed + spec.phaseOffset) * spec.radius
        let floatY = sin(time * spec.speed * 1.3 + spec.phaseOffset) * spec.radius
        let baseX = spec.anchor.x * containerSize.width
        let baseY = spec.anchor.y * containerSize.height

        Circle()
            .fill(spec.color)
            .frame(width: spec.baseSize, height: spec.baseSize)
            .scaleEffect(bump ? 1.12 : 1)
            .position(
                x: baseX + floatX + settledOffset.width + dragTranslation.width,
                y: baseY + floatY + settledOffset.height + dragTranslation.height
            )
            .gesture(
                DragGesture()
                    .updating($dragTranslation) { value, state, _ in state = value.translation }
                    .onEnded { value in
                        settledOffset.width += value.translation.width
                        settledOffset.height += value.translation.height
                    }
            )
            .onTapGesture {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.4)) { bump = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.4)) { bump = false }
                }
            }
            .animation(.interactiveSpring(), value: dragTranslation)
    }
}

struct GateCard: View {
    let onGiveFullAccess: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 30))
                .foregroundStyle(CirclePalette.violet)
            Eyebrow("PHOTO ACCESS")
            Text("Make space for your memories.")
                .font(CircleType.display(24, weight: .heavy))
                .multilineTextAlignment(.center)
                .foregroundStyle(CirclePalette.ink)
            Text("Give Circle access to your full library to create a private highlight reel with the friends you've already added. Photos never leave this device.")
                .font(.system(size: 13))
                .foregroundStyle(CirclePalette.muted)
                .multilineTextAlignment(.center)
            Button(action: onGiveFullAccess) {
                Text("Give access to full library")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(CirclePalette.paper, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
    }
}

struct ScanningCard: View {
    @State private var rotation: Double = 0

    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(CirclePalette.violetSoft, lineWidth: 3)
                    .frame(width: 56, height: 56)
                Circle()
                    .trim(from: 0, to: 0.25)
                    .stroke(CirclePalette.violet, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                    .frame(width: 56, height: 56)
                    .rotationEffect(.degrees(rotation))
                    .onAppear {
                        withAnimation(.linear(duration: 0.9).repeatForever(autoreverses: false)) {
                            rotation = 360
                        }
                    }
            }
            Text("Scanning your photos")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(CirclePalette.violetDeep)
            Text("Looking for moments with your circle…")
                .font(CircleType.display(18, weight: .bold))
                .foregroundStyle(CirclePalette.ink)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 46)
        .background(CirclePalette.paper, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
    }
}

/// A full-screen photo reel that advances every 7 seconds while keeping its
/// controls and captions inside the iPhone's readable area. Ordering comes
/// from the deterministic ReelRanking algorithm, which favors photos like
/// the ones a person has starred while still keeping the reel varied.
struct HighlightReel: View {
    @EnvironmentObject private var store: CircleStore
    @State private var index = 0
    @State private var asOf = Date()
    @State private var photoSettled = false

    /// Every reel image gets the same deliberate full-screen crop. The small
    /// settle is a calm camera-roll motion, not a different layout per photo.
    private let photoScale: CGFloat = 1.14

    private let timer = Timer.publish(every: 7, on: .main, in: .common).autoconnect()
    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }()

    var body: some View {
        let ranked = ReelRanking.rank(highlights: store.highlights, starredIDs: store.starredHighlightIDs, asOf: asOf)
        Group {
            if ranked.isEmpty {
                Color.clear
            } else {
                let current = ranked[index % ranked.count]
                let isStarred = store.starredHighlightIDs.contains(current.highlight.id)
                GeometryReader { proxy in
                    ZStack {
                        Image(current.highlight.imageName)
                            .resizable()
                            .scaledToFill()
                            .frame(width: proxy.size.width, height: proxy.size.height)
                            .scaleEffect(photoSettled ? photoScale : photoScale * 1.055)
                            .saturation(1.04)
                            .contrast(1.025)
                            .clipped()
                            .id(current.highlight.id)
                            .transition(.opacity)

                        LinearGradient(
                            colors: [.clear, .clear, .black.opacity(0.18), .black.opacity(0.78)],
                            startPoint: .top,
                            endPoint: .bottom
                        )

                        VStack(spacing: 0) {
                            Spacer()

                            VStack(alignment: .leading, spacing: 5) {
                                Text(current.highlight.caption)
                                    .font(.system(size: 17, weight: .semibold, design: .serif))
                                    .italic()
                                    .lineLimit(2)
                                    .foregroundStyle(.white)
                                    .shadow(color: .black.opacity(0.48), radius: 6)
                                Text(captionMeta(current.highlight))
                                    .font(.system(size: 11, weight: .semibold))
                                    .lineLimit(1)
                                    .foregroundStyle(.white.opacity(0.82))

                                Button(action: { store.toggleStar(current.highlight.id) }) {
                                    Image(systemName: isStarred ? "star.fill" : "star")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(isStarred ? CirclePalette.peach : .white)
                                        .frame(width: 32, height: 32)
                                        .background(Color.black.opacity(0.32), in: Circle())
                                        .overlay(Circle().stroke(isStarred ? CirclePalette.peach.opacity(0.9) : .white.opacity(0.34), lineWidth: 1))
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel(isStarred ? "Remove saved photo" : "Save photo")
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 18)
                            // The image extends beneath the floating tab bar,
                            // while this row remains just above its hit area.
                            .padding(.bottom, 104)
                            .id(current.highlight.id)
                            .transition(.opacity)
                        }
                    }
                    .frame(width: proxy.size.width, height: proxy.size.height)
                    .clipped()
                    .contentShape(Rectangle())
                    .onTapGesture { advance() }
                    .onAppear { settlePhoto() }
                    .onChange(of: index) { _, _ in settlePhoto() }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onReceive(timer) { _ in advance() }
    }

    private func advance() {
        guard !store.highlights.isEmpty else { return }
        withAnimation(.easeInOut(duration: 0.3)) {
            index += 1
        }
    }

    private func settlePhoto() {
        photoSettled = false
        DispatchQueue.main.async {
            withAnimation(.easeOut(duration: 6.6)) {
                photoSettled = true
            }
        }
    }

    private func captionMeta(_ highlight: Highlight) -> String {
        let names = highlight.friendIds.map { store.friendName($0) }.joined(separator: " and ")
        return "\(names) · \(highlight.place) · \(Self.dateFormatter.string(from: highlight.capturedAt))"
    }
}

// MARK: - People tab

struct PeopleView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var selected: Friend?

    private let columns = [GridItem(.flexible(), spacing: 17), GridItem(.flexible(), spacing: 17)]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                CircleHeader()

                LazyVGrid(columns: columns, spacing: 24) {
                    ForEach(store.friends) { friend in
                        PersonCard(
                            friend: friend,
                            note: Binding(
                                get: { store.personalNotes[friend.id, default: ""] },
                                set: { store.personalNotes[friend.id] = $0 }
                            ),
                            onOpenDetail: { selected = friend }
                        )
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .background(CircleAtmosphere())
        .sheet(item: $selected) { friend in
            PersonDetailSheet(friend: friend)
        }
    }
}

struct PersonCard: View {
    let friend: Friend
    @Binding var note: String
    let onOpenDetail: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: onOpenDetail) {
                VStack(alignment: .leading, spacing: 8) {
                    ZStack(alignment: .bottomTrailing) {
                        Color.clear
                            .aspectRatio(4.0 / 5.0, contentMode: .fit)
                            .overlay(
                                Image(friend.imageName)
                                    .resizable()
                                    .scaledToFill()
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                        Text(friend.initials)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.black)
                            .frame(width: 30, height: 30)
                            .background(.white, in: Circle())
                            .padding(8)
                    }

                    Text(friend.firstName)
                        .font(CircleType.display(16, weight: .bold))
                        .foregroundStyle(CirclePalette.ink)
                }
            }
            .buttonStyle(.plain)

            // A note you write yourself — not generated, just yours.
            TextField("Add a note…", text: $note, axis: .vertical)
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(CirclePalette.muted)
                .lineLimit(1...2)
                .textFieldStyle(.plain)
        }
    }
}

struct PersonDetailSheet: View {
    @EnvironmentObject private var store: CircleStore
    @Environment(\.dismiss) private var dismiss
    let friend: Friend
    @State private var selectedActivity: Activity?

    private let columns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    ZStack(alignment: .bottomLeading) {
                        Image(friend.imageName)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 300)
                            .frame(maxWidth: .infinity)
                            .clipped()

                        LinearGradient(colors: [.clear, .black.opacity(0.15), .black.opacity(0.6)], startPoint: .center, endPoint: .bottom)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(friend.displayName)
                                .font(CircleType.display(26, weight: .heavy))
                                .foregroundStyle(.white)
                            Text(friend.interestSummary)
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.85))
                            Text(friend.personality)
                                .font(.system(size: 12))
                                .foregroundStyle(.white.opacity(0.7))
                                .lineLimit(2)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .environment(\.colorScheme, .dark)
                        .padding(14)
                    }
                    .frame(height: 300)
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 28, style: .continuous)
                            .stroke(LinearGradient(colors: [.white.opacity(0.5), .white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1)
                    )
                    .padding(.horizontal, 20)
                    .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 12) {
                        Eyebrow("CONNECT")
                        HStack(spacing: 16) {
                            SocialLinkButton(url: friend.instagramURL, platform: .instagram)
                            SocialLinkButton(url: friend.whatsAppURL, platform: .whatsapp)
                            SocialLinkButton(url: friend.snapchatURL, platform: .snapchat)
                            SocialLinkButton(url: friend.xURL, platform: .x)
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 20)

                    VStack(alignment: .leading, spacing: 14) {
                        Eyebrow("PERFECT TOGETHER")
                        Text("Things you two might like")
                            .font(CircleType.display(22, weight: .bold))
                            .foregroundStyle(CirclePalette.ink)

                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(store.matchingActivities(for: friend)) { activity in
                                Button(action: { selectedActivity = activity }) {
                                    GlassEventCard(activity: activity, matchedInterest: store.matchReason(for: activity, friend: friend))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .background(CircleAtmosphere())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(item: $selectedActivity) { activity in
                EventDetailSheet(activity: activity, friends: store.friends.filter { tagsOverlap(activity.tags, $0.interests) })
            }
        }
    }
}

/// A glass-badge quick link to an external social app/profile for a friend.
/// Uses fixture-derived handles; this is a synthetic demo, not real accounts.
enum SocialPlatform {
    case instagram, whatsapp, snapchat, x

    var label: String {
        switch self {
        case .instagram: return "Instagram"
        case .whatsapp: return "WhatsApp"
        case .snapchat: return "Snapchat"
        case .x: return "X"
        }
    }

    /// Instagram and WhatsApp ship full-color glyphs, so their badge is transparent;
    /// Snapchat and X's glyphs are single-color, composited onto their brand color.
    var badgeBackground: AnyShapeStyle {
        switch self {
        case .instagram, .whatsapp: return AnyShapeStyle(Color.white.opacity(0.08))
        case .snapchat: return AnyShapeStyle(Color(red: 1.0, green: 0.98, blue: 0.0))
        case .x: return AnyShapeStyle(Color.black)
        }
    }
}

/// A glass-badge quick link to an external social app/profile, rendering each
/// platform's real logo mark (fetched from public brand-asset sources).
struct SocialLinkButton: View {
    let url: URL
    let platform: SocialPlatform

    var body: some View {
        Link(destination: url) {
            VStack(spacing: 6) {
                logo
                    .frame(width: 52, height: 52)
                    .background(platform.badgeBackground, in: Circle())
                    .overlay(
                        Circle().stroke(LinearGradient(colors: [.white.opacity(0.5), .white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)

                Text(platform.label)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(CirclePalette.muted)
            }
        }
    }

    @ViewBuilder
    private var logo: some View {
        switch platform {
        case .instagram:
            Image("social-instagram").resizable().scaledToFill().clipShape(Circle())
        case .whatsapp:
            Image("social-whatsapp").resizable().scaledToFill().clipShape(Circle())
        case .snapchat:
            Image("social-snapchat").renderingMode(.template).resizable().scaledToFit()
                .foregroundStyle(.white).padding(12)
        case .x:
            Image("social-x").renderingMode(.template).resizable().scaledToFit()
                .foregroundStyle(.white).padding(15)
        }
    }
}

/// A frosted "glass" tile for a single activity — used in the friend detail
/// sheet's "Perfect together" grid, matching Apple's translucent-material look.
struct GlassEventCard: View {
    let activity: Activity
    var matchedInterest: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack(alignment: .topLeading) {
                ActivityArtwork(activity: activity, cornerRadius: 16)

                if let matchedInterest {
                    Text(matchedInterest.capitalized)
                        .font(.system(size: 8.5, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 4)
                        .background(.ultraThinMaterial, in: Capsule())
                        .environment(\.colorScheme, .dark)
                        .padding(6)
                }
            }
            .padding(6)

            VStack(alignment: .leading, spacing: 3) {
                Text(activity.title)
                    .font(CircleType.display(14, weight: .bold))
                    .foregroundStyle(CirclePalette.ink)
                    .lineLimit(1)
                Text("\(activity.location) · \(activity.details)")
                    .font(.system(size: 10.5))
                    .foregroundStyle(CirclePalette.muted)
                    .lineLimit(1)
                if let matchedInterest {
                    Text("Fits their \(matchedInterest)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(CirclePalette.violetDeep)
                        .lineLimit(1)
                }
            }
            .padding(.horizontal, 10)
            .padding(.bottom, 10)
        }
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(LinearGradient(colors: [.white.opacity(0.45), .white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.22), radius: 10, y: 6)
    }
}

// MARK: - Event detail

/// A full detail page for a single event — hero photo, an "AI"-flavored blurb,
/// who in the circle it fits, and a few real, working external links.
struct EventDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let activity: Activity
    let friends: [Friend]

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                ShareLink(item: shareText)
                Spacer()
                Button("Done") { dismiss() }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    ZStack(alignment: .bottomLeading) {
                        ActivityArtwork(activity: activity, cornerRadius: 28)
                        LinearGradient(colors: [.clear, .black.opacity(0.2), .black.opacity(0.72)], startPoint: .center, endPoint: .bottom)

                        VStack(alignment: .leading, spacing: 8) {
                            Text((activity.tags.first ?? "Plan").capitalized)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.ultraThinMaterial, in: Capsule())
                                .environment(\.colorScheme, .dark)
                            Text(activity.title)
                                .font(CircleType.display(26, weight: .heavy))
                                .foregroundStyle(.white)
                            Text("\(activity.location) · \(activity.details)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.85))
                        }
                        .padding(18)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .overlay(
                        RoundedRectangle(cornerRadius: 28, style: .continuous)
                            .stroke(LinearGradient(colors: [.white.opacity(0.5), .white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1)
                    )
                    .padding(.top, 8)

                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow("ABOUT")
                        Text(aboutText)
                            .font(.system(size: 14))
                            .foregroundStyle(CirclePalette.muted)
                            .lineSpacing(3)
                    }

                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        EventFactTile(icon: "calendar", label: "WHEN", value: activity.details)
                        EventFactTile(icon: "figure.2", label: "BEST WITH", value: friends.isEmpty ? "Your circle" : friends.map(\.firstName).joined(separator: ", "))
                        EventFactTile(icon: "clock", label: "TIME TO PLAN", value: venue.planningWindow)
                        EventFactTile(icon: "sparkles", label: "VIBE", value: venue.vibe)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow("WHERE TO GO")
                        Map(initialPosition: .region(venue.region)) {
                            Marker(activity.location, coordinate: venue.coordinate)
                        }
                        .mapStyle(.standard)
                        .frame(height: 190)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(CirclePalette.line, lineWidth: 1)
                        )

                        HStack(spacing: 8) {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundStyle(CirclePalette.violetDeep)
                            Text(venue.address)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(CirclePalette.muted)
                            Spacer()
                        }
                    }

                    if !friends.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Eyebrow("FITS YOUR CIRCLE")
                            HStack(spacing: 16) {
                                ForEach(friends) { friend in
                                    VStack(spacing: 6) {
                                        Color.clear
                                            .aspectRatio(1, contentMode: .fit)
                                            .overlay(
                                                Image(friend.imageName)
                                                    .resizable()
                                                    .scaledToFill()
                                            )
                                            .clipShape(Circle())
                                            .frame(width: 48, height: 48)
                                        Text(friend.firstName)
                                            .font(.system(size: 10, weight: .semibold))
                                            .foregroundStyle(CirclePalette.muted)
                                    }
                                }
                                Spacer()
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow("PLAN IT")
                        VStack(spacing: 10) {
                            EventLinkRow(icon: "map", title: "Open in Apple Maps", subtitle: venue.address, url: directionsURL)
                            EventLinkRow(icon: "globe", title: "Open in Google Maps", subtitle: "Directions and reviews", url: googleMapsURL)
                            EventLinkRow(icon: "ticket.fill", title: "Find tickets", subtitle: "Search Eventbrite", url: eventbriteURL)
                            EventLinkRow(icon: "building.2", title: "Visit venue site", subtitle: "Hours and event info", url: venueURL)
                            EventLinkRow(icon: "safari.fill", title: "Search the web", subtitle: "\(activity.title) · \(activity.location)", url: searchURL)
                        }
                    }
                    .padding(.bottom, 30)
                }
                .safeAreaPadding(.horizontal, 20)
            }
        }
        .background(CircleAtmosphere())
    }

    private var aboutText: String {
        "A \(venue.vibe.lowercased()) \(activity.tags.first ?? "circle") plan at \(activity.location), \(activity.details.lowercased()). Make a low-pressure plan, send it to the people shown above, and keep the details in one place."
    }

    private var venue: EventVenue { EventVenue.forActivity(activity) }

    private var directionsURL: URL {
        let query = activity.location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "http://maps.apple.com/?q=\(query)")!
    }

    private var googleMapsURL: URL {
        let query = "\(activity.location) \(venue.address)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "https://www.google.com/maps/search/?api=1&query=\(query)")!
    }

    private var eventbriteURL: URL {
        let query = activity.title.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "https://www.eventbrite.com/d/search/?q=\(query)")!
    }

    private var searchURL: URL {
        let query = "\(activity.title) \(activity.location)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "https://www.google.com/search?q=\(query)")!
    }

    private var venueURL: URL {
        let query = "\(activity.location) official site".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "https://www.google.com/search?q=\(query)")!
    }

    private var shareText: String { "\(activity.title) at \(activity.location): \(activity.details)" }
}

struct EventFactTile: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(CirclePalette.violetDeep)
            Text(label)
                .font(CircleType.label(8, weight: .bold))
                .foregroundStyle(CirclePalette.muted)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(CirclePalette.ink)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, minHeight: 92, alignment: .topLeading)
        .padding(13)
        .background(CirclePalette.paper.opacity(0.78), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(CirclePalette.line.opacity(0.85), lineWidth: 1)
        )
    }
}

struct EventVenue {
    let coordinate: CLLocationCoordinate2D
    let address: String
    let planningWindow: String
    let vibe: String

    var region: MKCoordinateRegion {
        MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.012, longitudeDelta: 0.012)
        )
    }

    static func forActivity(_ activity: Activity) -> EventVenue {
        switch activity.id {
        case "beginner-bouldering":
            EventVenue(coordinate: .init(latitude: -33.891, longitude: 151.183), address: "2–14 Wilson St, Newtown", planningWindow: "Book by Tuesday", vibe: "Active and easy")
        case "clay-social":
            EventVenue(coordinate: .init(latitude: -33.885, longitude: 151.210), address: "18 Goodhope St, Paddington", planningWindow: "Spaces move fast", vibe: "Hands-on and slow")
        case "harbour-jazz":
            EventVenue(coordinate: .init(latitude: -33.891, longitude: 151.174), address: "42 King St, Newtown", planningWindow: "Arrive by 7:30pm", vibe: "Late-night and lively")
        case "rooftop-cinema", "foreign-film":
            EventVenue(coordinate: .init(latitude: -33.881, longitude: 151.212), address: "80 Commonwealth St, Surry Hills", planningWindow: "Choose seats early", vibe: "Relaxed and cinematic")
        case "run-club", "park-pilates":
            EventVenue(coordinate: .init(latitude: -33.870, longitude: 151.200), address: "Darling Harbour, Sydney", planningWindow: "Just show up", vibe: "Fresh-air and social")
        case "vintage-market", "record-fair":
            EventVenue(coordinate: .init(latitude: -33.898, longitude: 151.187), address: "245 Wilson St, Eveleigh", planningWindow: "Best before lunch", vibe: "Wandering and curious")
        case "silent-reading", "book-launch":
            EventVenue(coordinate: .init(latitude: -33.881, longitude: 151.220), address: "Surry Hills, Sydney", planningWindow: "Save a spot", vibe: "Quiet and thoughtful")
        case "warehouse-dance", "open-mic":
            EventVenue(coordinate: .init(latitude: -33.900, longitude: 151.174), address: "Marrickville, Sydney", planningWindow: "Doors open early", vibe: "Noisy and spontaneous")
        case "morning-swim":
            EventVenue(coordinate: .init(latitude: -33.891, longitude: 151.277), address: "1 Notts Ave, Bondi Beach", planningWindow: "Meet at sunrise", vibe: "Bracing and bright")
        case "night-market", "pasta-club":
            EventVenue(coordinate: .init(latitude: -33.880, longitude: 151.206), address: "Haymarket, Sydney", planningWindow: "Go hungry", vibe: "Loose and delicious")
        default:
            EventVenue(coordinate: .init(latitude: -33.883, longitude: 151.205), address: "Sydney, NSW", planningWindow: "Make a plan this week", vibe: "Easygoing and local")
        }
    }
}

struct EventLinkRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let url: URL

    var body: some View {
        Link(destination: url) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(CirclePalette.violetDeep)
                    .frame(width: 38, height: 38)
                    .background(CirclePalette.violetSoft, in: Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(CirclePalette.ink)
                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundStyle(CirclePalette.muted)
                        .lineLimit(1)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(CirclePalette.muted)
            }
            .padding(12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(LinearGradient(colors: [.white.opacity(0.4), .white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    CircleRootView()
        .environmentObject(CircleStore())
        .preferredColorScheme(.dark)
}
