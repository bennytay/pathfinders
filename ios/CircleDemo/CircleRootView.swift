import SwiftUI

struct CircleRootView: View {
    var body: some View {
        TabView {
            PlanView()
                .tabItem { Label("Plan", systemImage: "calendar") }
            CaptureView()
                .tabItem { Label("Capture", systemImage: "sparkles") }
            PeopleView()
                .tabItem { Label("People", systemImage: "person.2") }
        }
        .tint(CirclePalette.violet)
        .preferredColorScheme(.dark)
    }
}

// MARK: - Shared header

struct CircleHeader: View {
    @EnvironmentObject private var store: CircleStore

    var body: some View {
        HStack {
            (Text("circle").foregroundStyle(CirclePalette.ink) + Text(".").foregroundStyle(CirclePalette.violet))
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .tracking(-0.7)
                .onLongPressGesture(minimumDuration: 0.6) {
                    store.reset()
                }
            Spacer()
        }
        .padding(.top, 4)
    }
}

struct Eyebrow: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .heavy))
            .tracking(1.1)
            .foregroundStyle(CirclePalette.violetDeep)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .bold))
            .padding(.vertical, 14)
            .foregroundStyle(CirclePalette.canvas)
            .background(CirclePalette.violet.opacity(configuration.isPressed ? 0.8 : 1), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

// MARK: - Plan tab

struct PlanView: View {
    @EnvironmentObject private var store: CircleStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                CircleHeader()

                VStack(alignment: .leading, spacing: 6) {
                    Eyebrow("YOUR WEEK")
                    Text("Make room for people.")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .tracking(-0.8)
                        .foregroundStyle(CirclePalette.ink)
                }

                MiniCalendarView(events: store.calendarEvents)

                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 4) {
                        Eyebrow("FOR YOUR CIRCLE")
                        Text("Events worth doing together")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundStyle(CirclePalette.ink)
                    }
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 20) {
                        ForEach(store.activities) { activity in
                            ActivityCard(activity: activity, friends: fittingFriends(for: activity))
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .background(CirclePalette.canvas.ignoresSafeArea())
    }

    private func fittingFriends(for activity: Activity) -> [Friend] {
        let matches = store.friends.filter { friend in
            activity.tags.contains { tag in friend.interest.lowercased().contains(tag.lowercased()) }
        }
        return Array((matches.isEmpty ? store.friends : matches).prefix(3))
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
                Color.clear
                    .aspectRatio(4.0 / 3.0, contentMode: .fit)
                    .overlay(
                        Image(activity.id)
                            .resizable()
                            .scaledToFill()
                    )
                    .overlay(LinearGradient(colors: [.black.opacity(0.02), .black.opacity(0.5)], startPoint: .top, endPoint: .bottom))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                Text((activity.tags.first ?? "Plan").capitalized)
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 4)
                    .background(.white.opacity(0.9), in: Capsule())
                    .padding(8)
            }

            Text(activity.title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(CirclePalette.ink)
                .lineLimit(1)
            Text("\(activity.location) · \(activity.details)")
                .font(.system(size: 11))
                .foregroundStyle(CirclePalette.muted)
                .lineLimit(1)
            Text("Fits \(friends.map(\.firstName).joined(separator: ", "))")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(CirclePalette.violetDeep)
                .lineLimit(1)
        }
    }
}

// MARK: - Capture tab

enum MicState {
    case idle, listening, saved
}

struct CaptureView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var micState: MicState = .idle

    var body: some View {
        ZStack {
            CirclePalette.canvas.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                CircleHeader()
                    .padding(.horizontal, 20)

                switch store.stage {
                case .gate:
                    GateCard(onScan: { store.startScan() })
                        .padding(.horizontal, 20)
                    Spacer()
                case .scanning:
                    ScanningCard()
                        .padding(.horizontal, 20)
                    Spacer()
                case .reel:
                    HighlightReel()
                }
            }

            if store.stage == .reel {
                MicButton(state: $micState)
                    .padding(.trailing, 20)
                    .padding(.bottom, 28)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
            }
        }
    }
}

struct GateCard: View {
    let onScan: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 30))
                .foregroundStyle(CirclePalette.violet)
            Eyebrow("PHOTO-NATIVE")
            Text("Let Circle learn your circle.")
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundStyle(CirclePalette.ink)
            Text("Circle scans the photos on this device for the friends you've already added, matching against the reference photo already on each profile. It never uploads a photo.")
                .font(.system(size: 13))
                .foregroundStyle(CirclePalette.muted)
                .multilineTextAlignment(.center)
            Button(action: onScan) {
                Text("Scan my photos")
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
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(CirclePalette.ink)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 46)
        .background(CirclePalette.paper, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
    }
}

struct HighlightReel: View {
    @EnvironmentObject private var store: CircleStore
    @State private var index = 0

    private let timer = Timer.publish(every: 7, on: .main, in: .common).autoconnect()
    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }()

    var body: some View {
        let highlights = store.highlights
        GeometryReader { proxy in
            if highlights.isEmpty {
                Color.clear
            } else {
                let current = highlights[index % highlights.count]
                ZStack(alignment: .top) {
                    Image(current.imageName)
                        .resizable()
                        .scaledToFill()
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .clipped()
                        .id(current.id)
                        .transition(.opacity)

                    LinearGradient(colors: [.clear, .black.opacity(0.15), .black.opacity(0.88)], startPoint: .center, endPoint: .bottom)

                    VStack(spacing: 0) {
                        HStack(spacing: 4) {
                            ForEach(highlights.indices, id: \.self) { dot in
                                Capsule()
                                    .fill(Color.white.opacity(dot == index % highlights.count ? 0.95 : 0.32))
                                    .frame(height: 3)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 16)

                        Spacer()

                        VStack(alignment: .leading, spacing: 6) {
                            Text(current.caption)
                                .font(.system(size: 23, weight: .semibold, design: .serif))
                                .italic()
                                .foregroundStyle(.white)
                                .shadow(color: .black.opacity(0.5), radius: 8)
                            Text(captionMeta(current))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.85))
                        }
                        .padding(.horizontal, 18)
                        .padding(.bottom, 26)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    HStack {
                        Spacer()
                        Button(action: { store.rescan() }) {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .foregroundStyle(.white)
                                .frame(width: 34, height: 34)
                                .background(.black.opacity(0.4), in: Circle())
                        }
                    }
                    .padding(.top, 40)
                    .padding(.trailing, 16)
                }
                .contentShape(Rectangle())
                .onTapGesture { advance() }
            }
        }
        .onReceive(timer) { _ in advance() }
        .ignoresSafeArea(edges: .bottom)
    }

    private func advance() {
        guard !store.highlights.isEmpty else { return }
        withAnimation(.easeInOut(duration: 0.3)) {
            index = (index + 1) % store.highlights.count
        }
    }

    private func captionMeta(_ highlight: Highlight) -> String {
        let names = highlight.friendIds.map { store.friendName($0) }.joined(separator: " and ")
        return "\(names) · \(highlight.place) · \(Self.dateFormatter.string(from: highlight.capturedAt))"
    }
}

struct MicButton: View {
    @Binding var state: MicState
    @State private var pulse = false
    @State private var sheenRotation: Double = 0

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            if state == .listening {
                Text("Listening…")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial, in: Capsule())
                    .transition(.opacity.combined(with: .scale(scale: 0.85)))
            } else if state == .saved {
                Text("Saved privately on this device.")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial, in: Capsule())
                    .transition(.opacity.combined(with: .scale(scale: 0.85)))
            }

            Button(action: handleTap) {
                ZStack {
                    LiquidGlassBlobs(active: state == .listening)

                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 54, height: 54)
                        .overlay(
                            Circle()
                                .stroke(
                                    AngularGradient(
                                        colors: [CirclePalette.violet.opacity(0.95), .white.opacity(0.7), CirclePalette.violet.opacity(0.15), CirclePalette.violet.opacity(0.95)],
                                        center: .center,
                                        angle: .degrees(sheenRotation)
                                    ),
                                    lineWidth: state == .listening ? 2.4 : 1
                                )
                        )
                        .shadow(color: CirclePalette.violet.opacity(state == .listening ? 0.6 : 0.18), radius: state == .listening ? 16 : 6)
                        .scaleEffect(state == .listening && pulse ? 1.1 : 1)

                    Image(systemName: state == .listening ? "waveform" : "mic.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                }
                .frame(width: 90, height: 90)
            }
            .buttonStyle(.plain)
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.7), value: state)
        .onAppear {
            withAnimation(.linear(duration: 2.4).repeatForever(autoreverses: false)) {
                sheenRotation = 360
            }
            withAnimation(.easeInOut(duration: 0.85).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }

    private func handleTap() {
        guard state == .idle else { return }
        state = .listening
        Task {
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            state = .saved
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            state = .idle
        }
    }
}

/// A soft, continuously-morphing cluster of frosted blobs behind the mic button —
/// TimelineView drives it so the wobble is a live function of elapsed time rather
/// than a one-shot interpolation between two states.
struct LiquidGlassBlobs: View {
    var active: Bool

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: !active)) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate
            ZStack {
                ForEach(0..<4, id: \.self) { i in
                    let phase = t * 1.7 + Double(i) * 1.6
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 44, height: 44)
                        .scaleEffect(0.8 + 0.4 * CGFloat(sin(phase)))
                        .offset(
                            x: CGFloat(cos(phase * 0.85)) * 22,
                            y: CGFloat(sin(phase * 1.15)) * 22
                        )
                        .blur(radius: 4)
                        .opacity(active ? 0.65 : 0)
                }
            }
        }
        .frame(width: 90, height: 90)
        .allowsHitTesting(false)
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

                VStack(alignment: .leading, spacing: 4) {
                    Eyebrow("PEOPLE")
                    Text("Your circle")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .tracking(-0.8)
                        .foregroundStyle(CirclePalette.ink)
                    Text("Faces, not follower counts.")
                        .font(.system(size: 13))
                        .foregroundStyle(CirclePalette.muted)
                }

                LazyVGrid(columns: columns, spacing: 24) {
                    ForEach(store.friends) { friend in
                        Button(action: { selected = friend }) {
                            PersonCard(friend: friend)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .background(CirclePalette.canvas.ignoresSafeArea())
        .sheet(item: $selected) { friend in
            PersonDetailSheet(friend: friend)
        }
    }
}

struct PersonCard: View {
    let friend: Friend

    var body: some View {
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
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(CirclePalette.ink)
            Text(friend.interest)
                .font(.system(size: 12))
                .foregroundStyle(CirclePalette.muted)
                .lineLimit(2)
        }
    }
}

struct PersonDetailSheet: View {
    @EnvironmentObject private var store: CircleStore
    @Environment(\.dismiss) private var dismiss
    let friend: Friend

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Image(friend.imageName)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 260)
                        .frame(maxWidth: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        .clipped()

                    VStack(alignment: .leading, spacing: 4) {
                        Text(friend.displayName)
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .foregroundStyle(CirclePalette.ink)
                        Text(friend.interest)
                            .font(.system(size: 14))
                            .foregroundStyle(CirclePalette.muted)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Eyebrow("SHARED EVENTS")
                        ForEach(store.activities.prefix(2)) { activity in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(activity.title)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(CirclePalette.ink)
                                Text("\(activity.location) · \(activity.details)")
                                    .font(.system(size: 12))
                                    .foregroundStyle(CirclePalette.muted)
                            }
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(CirclePalette.violetSoft, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .padding(20)
            }
            .background(CirclePalette.canvas.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
