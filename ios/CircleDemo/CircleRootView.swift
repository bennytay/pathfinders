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
    @State private var selectedActivity: Activity?

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
                            Button(action: { selectedActivity = activity }) {
                                ActivityCard(activity: activity, friends: fittingFriends(for: activity))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .background(CirclePalette.canvas.ignoresSafeArea())
        .fullScreenCover(item: $selectedActivity) { activity in
            EventDetailSheet(activity: activity, friends: fittingFriends(for: activity))
        }
    }

    private func fittingFriends(for activity: Activity) -> [Friend] {
        let matches = store.friends.filter { tagsOverlap(activity.tags, $0.interests) }
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
                .font(.system(size: 13, weight: .semibold))
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

enum MicState {
    case idle, listening, saved
}

struct CaptureView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var micState: MicState = .idle

    var body: some View {
        ZStack {
            CirclePalette.canvas.ignoresSafeArea()

            if store.stage != .reel {
                FloatingSpheresBackground()
                    .ignoresSafeArea()
            }

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
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

            if store.stage == .reel {
                MicButton(state: $micState)
                    .padding(.trailing, 20)
                    .padding(.bottom, 28)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
            }
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

/// A full-screen photo reel that advances every 7 seconds while keeping its
/// controls and captions inside the iPhone's readable area.
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
        Group {
            if highlights.isEmpty {
                Color.clear
            } else {
                let current = highlights[index % highlights.count]
                GeometryReader { proxy in
                    ZStack {
                        Image(current.imageName)
                            .resizable()
                            .scaledToFill()
                            .frame(width: proxy.size.width, height: proxy.size.height)
                            .clipped()
                            .id(current.id)
                            .transition(.opacity)

                        LinearGradient(colors: [.clear, .black.opacity(0.15), .black.opacity(0.88)], startPoint: .center, endPoint: .bottom)

                        VStack(spacing: 0) {
                            SlidingProgressBar(total: highlights.count, index: index, cycleDuration: 7)
                                .padding(.horizontal, 16)
                                .padding(.top, 10)

                            HStack {
                                Spacer()
                                Button(action: { store.rescan() }) {
                                    Image(systemName: "arrow.triangle.2.circlepath")
                                        .foregroundStyle(.white)
                                        .frame(width: 34, height: 34)
                                        .background(.black.opacity(0.4), in: Circle())
                                }
                            }
                            .padding(.top, 14)
                            .padding(.trailing, 16)

                            Spacer()

                            VStack(alignment: .leading, spacing: 6) {
                                Text(current.caption)
                                    .font(.system(size: 23, weight: .semibold, design: .serif))
                                    .italic()
                                    .lineLimit(2)
                                    .foregroundStyle(.white)
                                    .shadow(color: .black.opacity(0.5), radius: 8)
                                Text(captionMeta(current))
                                    .font(.system(size: 12, weight: .semibold))
                                    .lineLimit(2)
                                    .foregroundStyle(.white.opacity(0.85))
                            }
                            .padding(.horizontal, 18)
                            .padding(.trailing, 92)
                            .padding(.bottom, 14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .frame(width: proxy.size.width, height: proxy.size.height)
                    .clipped()
                    .contentShape(Rectangle())
                    .onTapGesture { advance() }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onReceive(timer) { _ in advance() }
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

/// A single continuous track whose fill slides forward through the reel,
/// rather than one static segment per photo.
struct SlidingProgressBar: View {
    let total: Int
    let index: Int
    let cycleDuration: Double

    var body: some View {
        GeometryReader { proxy in
            let fraction = total > 0 ? CGFloat(index % total + 1) / CGFloat(total) : 0
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.28))
                Capsule()
                    .fill(Color.white.opacity(0.95))
                    .frame(width: proxy.size.width * fraction)
                    .animation(.linear(duration: cycleDuration), value: index)
            }
        }
        .frame(height: 3)
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
        .background(CirclePalette.canvas.ignoresSafeArea())
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
                        .font(.system(size: 15, weight: .semibold))
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
                                .font(.system(size: 24, weight: .bold, design: .rounded))
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
                            .font(.system(size: 21, weight: .bold, design: .rounded))
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
            .background(CirclePalette.canvas.ignoresSafeArea())
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
                    .font(.system(size: 13, weight: .semibold))
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
                                .font(.system(size: 24, weight: .bold, design: .rounded))
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
                        Eyebrow("LINKS")
                        VStack(spacing: 10) {
                            EventLinkRow(icon: "mappin.and.ellipse", title: "Get directions", subtitle: activity.location, url: directionsURL)
                            EventLinkRow(icon: "ticket.fill", title: "Find tickets", subtitle: "Search Eventbrite", url: eventbriteURL)
                            EventLinkRow(icon: "safari.fill", title: "Search the web", subtitle: "\(activity.title) · \(activity.location)", url: searchURL)
                        }
                    }
                    .padding(.bottom, 30)
                }
                .safeAreaPadding(.horizontal, 20)
            }
        }
        .background(CirclePalette.canvas.ignoresSafeArea())
    }

    private var aboutText: String {
        "A \(activity.tags.first ?? "circle") pick at \(activity.location), \(activity.details.lowercased()). A relaxed, low-pressure way to spend time with the people you'd like to see more."
    }

    private var directionsURL: URL {
        let query = activity.location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "http://maps.apple.com/?q=\(query)")!
    }

    private var eventbriteURL: URL {
        let query = activity.title.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "https://www.eventbrite.com/d/search/?q=\(query)")!
    }

    private var searchURL: URL {
        let query = "\(activity.title) \(activity.location)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "https://www.google.com/search?q=\(query)")!
    }

    private var shareText: String { "\(activity.title) at \(activity.location): \(activity.details)" }
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
