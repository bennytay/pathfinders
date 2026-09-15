import SwiftUI

struct CircleRootView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var tab = 0
    @State private var showingSettings = false

    var body: some View {
        ZStack(alignment: .top) {
            CirclePalette.canvas.ignoresSafeArea()
            TabView(selection: $tab) {
                TodayView(showingSettings: $showingSettings, selectCapture: { tab = 1 })
                    .tabItem { Label("Today", systemImage: "house") }.tag(0)
                CaptureView()
                    .tabItem { Label("Capture", systemImage: "sparkles") }.tag(1)
                PeopleView()
                    .tabItem { Label("People", systemImage: "person.2") }.tag(2)
            }
            .tint(CirclePalette.violet)

            if let toast = store.toast {
                ToastView(message: toast)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .padding(.top, 6)
                    .zIndex(2)
            }
        }
        .sheet(isPresented: $showingSettings) { SettingsView() }
        .animation(.easeOut(duration: 0.22), value: store.toast)
    }
}

struct TodayView: View {
    @EnvironmentObject private var store: CircleStore
    @Binding var showingSettings: Bool
    let selectCapture: () -> Void
    @State private var showingPlanner = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    HStack {
                        Text("circle.").font(.system(size: 28, weight: .bold, design: .rounded)).tracking(-1)
                        Spacer()
                        Button { showingSettings = true } label: {
                            Image(systemName: "gearshape").frame(width: 36, height: 36)
                                .background(.white.opacity(0.8), in: Circle())
                        }.accessibilityLabel("Open settings")
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Eyebrow("TODAY, GENTLY")
                        Text("Keep the good\nparts close.")
                            .font(.system(size: 38, weight: .bold, design: .rounded)).tracking(-1.4)
                        Text("Context for the moments that happen away from your phone.")
                            .foregroundStyle(CirclePalette.muted).lineSpacing(3)
                    }

                    VStack(alignment: .leading, spacing: 18) {
                        HStack {
                            Avatar(friend: store.maya, large: true)
                            Spacer()
                            Label("A little nudge", systemImage: "sparkles")
                                .font(.caption.weight(.semibold)).foregroundStyle(CirclePalette.violet)
                                .padding(.horizontal, 10).padding(.vertical, 7)
                                .background(.white.opacity(0.65), in: Capsule())
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            Eyebrow("A GOOD TIME TO REACH OUT")
                            Text("See Maya?").font(.system(size: 31, weight: .bold, design: .rounded))
                            Text("You both mentioned trying bouldering. There’s a lovely reason to make time.")
                                .foregroundStyle(CirclePalette.muted).lineSpacing(3)
                        }
                        Button { showingPlanner = true } label: {
                            Label("Find something together", systemImage: "arrow.right")
                                .frame(maxWidth: .infinity)
                        }.buttonStyle(PrimaryButtonStyle())
                    }
                    .padding(20)
                    .background(CirclePalette.violetSoft, in: RoundedRectangle(cornerRadius: 28, style: .continuous))

                    HStack(alignment: .lastTextBaseline) {
                        VStack(alignment: .leading, spacing: 3) { Eyebrow("YOUR PEOPLE"); Text("Held close").font(.title2.bold()) }
                        Spacer()
                        Text("3 people").font(.subheadline.weight(.semibold)).foregroundStyle(CirclePalette.violet)
                    }
                    HStack(spacing: 19) { ForEach(store.friends) { friend in
                        VStack(spacing: 7) { Avatar(friend: friend); Text(friend.firstName).font(.caption.weight(.medium)) }
                    }}

                    Button { selectCapture() } label: {
                        HStack(spacing: 14) {
                            Image(systemName: "waveform").foregroundStyle(CirclePalette.violet)
                                .frame(width: 42, height: 42).background(CirclePalette.mint, in: RoundedRectangle(cornerRadius: 13))
                            VStack(alignment: .leading, spacing: 3) { Eyebrow("AFTER A SHARED MOMENT"); Text("Anything worth keeping?").font(.headline); Text("Say it in your own words.").font(.subheadline).foregroundStyle(CirclePalette.muted) }
                            Spacer(); Image(systemName: "plus.circle.fill").font(.title2).foregroundStyle(CirclePalette.ink)
                        }.padding(.vertical, 12)
                    }.buttonStyle(.plain)
                }.padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 32)
            }.toolbar(.hidden, for: .navigationBar)
        }.sheet(isPresented: $showingPlanner) { PlanSheet(friend: store.maya) }
    }
}

struct CaptureView: View {
    @EnvironmentObject private var store: CircleStore
    @State private var isRecording = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Eyebrow("HANGOUT RADAR")
                        Text("Moments, quietly noticed.").font(.system(size: 33, weight: .bold, design: .rounded)).tracking(-1)
                        Text("A demo of an opt-in photo check. Nothing becomes a memory until you say so.").foregroundStyle(CirclePalette.muted).lineSpacing(3)
                    }

                    if store.isScanning {
                        VStack(spacing: 16) { ProgressView().controlSize(.large); Text("Looking through the synthetic demo library…").font(.headline); Text("No real photos are accessed in this demo.").font(.subheadline).foregroundStyle(CirclePalette.muted) }
                            .frame(maxWidth: .infinity).padding(.vertical, 46).background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 26))
                    } else if store.momentFound {
                        MomentCandidateView()
                    } else {
                        VStack(spacing: 15) {
                            Image(systemName: "photo.on.rectangle.angled").font(.system(size: 34)).foregroundStyle(CirclePalette.violet)
                            Eyebrow("PHOTO LIBRARY")
                            Text("Looking for shared moments.").font(.title3.bold())
                            Text("Circle keeps potential hangouts separate until you decide they are real.").multilineTextAlignment(.center).foregroundStyle(CirclePalette.muted)
                            Button("Check recent photos") { store.scanForMoment() }.buttonStyle(PrimaryButtonStyle())
                            Text("Uses synthetic photos only.").font(.caption).foregroundStyle(CirclePalette.muted)
                        }.frame(maxWidth: .infinity).padding(24).background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 26))
                    }

                    VStack(alignment: .leading, spacing: 13) {
                        HStack { Image(systemName: isRecording ? "record.circle.fill" : "mic.fill").foregroundStyle(isRecording ? .red : CirclePalette.violet); Text(isRecording ? "Listening…" : "A quick note").font(.headline) }
                        Text(isRecording ? "Tap save to keep the demo recap." : store.savedNote).foregroundStyle(CirclePalette.muted).italic()
                        Button { if isRecording { store.saveVoiceNote() }; isRecording.toggle() } label: { Label(isRecording ? "Save note" : "Record a note", systemImage: isRecording ? "checkmark" : "mic") }.buttonStyle(SecondaryButtonStyle())
                    }.padding(18).background(CirclePalette.violetSoft.opacity(0.65), in: RoundedRectangle(cornerRadius: 22))
                }.padding(20)
            }.navigationTitle("Capture").navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct MomentCandidateView: View {
    @EnvironmentObject private var store: CircleStore
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ZStack(alignment: .bottomLeading) {
                LinearGradient(colors: [CirclePalette.mint, CirclePalette.violetSoft], startPoint: .topLeading, endPoint: .bottomTrailing)
                VStack(alignment: .leading) { Text("Saturday").font(.caption.bold()); Text("Newtown").font(.title2.bold()) }.padding(16)
            }.frame(height: 155).clipShape(RoundedRectangle(cornerRadius: 18))
            Label("A possible hangout", systemImage: "circle.fill").font(.caption.weight(.semibold)).foregroundStyle(CirclePalette.violet)
            Text("Was this with Maya and Ari?").font(.title3.bold())
            Text("Saturday, 12 Sep · Newtown").foregroundStyle(CirclePalette.muted)
            HStack { Button("Keep this moment") { store.keepMoment() }.buttonStyle(PrimaryButtonStyle()); Button("Not this one") { store.momentFound = false }.buttonStyle(SecondaryButtonStyle()) }
            Text("Sample result only. This app has not opened your photo library.").font(.caption).foregroundStyle(CirclePalette.muted)
        }.padding(18).background(.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 26))
    }
}

struct PeopleView: View {
    @EnvironmentObject private var store: CircleStore
    var body: some View {
        NavigationStack {
            List {
                Section { Text("People you choose to keep close. No scores, no reminders you didn’t ask for.").foregroundStyle(CirclePalette.muted).listRowBackground(Color.clear) }
                Section("Your circle") { ForEach(store.friends) { friend in NavigationLink(value: friend) { HStack(spacing: 13) { Avatar(friend: friend); VStack(alignment: .leading, spacing: 3) { Text(friend.name).fontWeight(.semibold); Text(friend.lastSeen).font(.caption).foregroundStyle(CirclePalette.muted) } } } } }
                if !store.hangouts.isEmpty { Section("Saved moments") { ForEach(store.hangouts) { hangout in Label("Newtown with \(hangout.friend.firstName)", systemImage: "heart.fill").foregroundStyle(CirclePalette.violet) } } }
            }.scrollContentBackground(.hidden).background(CirclePalette.canvas).navigationTitle("People")
            .navigationDestination(for: Friend.self) { PersonDetail(friend: $0) }
        }
    }
}

struct PersonDetail: View {
    let friend: Friend
    @State private var showingPlanner = false
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 22) {
            HStack(spacing: 14) { Avatar(friend: friend, large: true); VStack(alignment: .leading) { Text(friend.name).font(.title.bold()); Text(friend.lastSeen).foregroundStyle(CirclePalette.muted) } }
            VStack(alignment: .leading, spacing: 13) { Eyebrow("HELD CONTEXT"); ForEach(friend.context, id: \.self) { Label($0, systemImage: "circle.fill").font(.subheadline).foregroundStyle(CirclePalette.muted) } }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(CirclePalette.violetSoft.opacity(0.55), in: RoundedRectangle(cornerRadius: 22))
            Button { showingPlanner = true } label: { Label("Make a gentle plan", systemImage: "calendar.badge.plus").frame(maxWidth: .infinity) }.buttonStyle(PrimaryButtonStyle())
        }.padding(20) }.background(CirclePalette.canvas).sheet(isPresented: $showingPlanner) { PlanSheet(friend: friend) }
    }
}

struct PlanSheet: View {
    @EnvironmentObject private var store: CircleStore
    let friend: Friend
    @Environment(\.dismiss) private var dismiss
    @State private var draft = DraftPlan()
    var body: some View {
        NavigationStack { Form {
            Section { Text("A draft for \(friend.firstName), based only on the context you chose to keep.").foregroundStyle(CirclePalette.muted) }
            Section("A simple plan") { Picker("When", selection: $draft.time) { Text("Saturday afternoon").tag("Saturday afternoon"); Text("Next weeknight").tag("Next weeknight") }; TextField("Activity", text: $draft.activity); TextField("Place", text: $draft.place) }
            Section { Button("Save private draft") { store.savePlan(draft); dismiss() }.frame(maxWidth: .infinity).foregroundStyle(CirclePalette.violet).fontWeight(.semibold) }
        }.navigationTitle("Make a plan").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Cancel") { dismiss() } } }
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var store: CircleStore
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack { List {
            Section("Your Circle") { Label("All demo context is stored locally", systemImage: "lock.fill"); Label("No contact import or outreach", systemImage: "hand.raised.fill") }
            Section("Demo controls") { Button("Reset sample space", role: .destructive) { store.resetDemo(); dismiss() } }
            Section { Text("This build is a local, synthetic demo for recording. It does not connect to a server or access a photo library.").font(.footnote).foregroundStyle(CirclePalette.muted) }
        }.navigationTitle("Settings").toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
    }
}

struct Avatar: View {
    let friend: Friend
    var large = false
    var body: some View { Text(friend.initials).font(.system(size: large ? 17 : 13, weight: .bold, design: .rounded)).foregroundStyle(CirclePalette.ink).frame(width: large ? 52 : 42, height: large ? 52 : 42).background(CirclePalette.avatar(friend.colorName), in: Circle()) }
}

struct Eyebrow: View { let text: String; init(_ text: String) { self.text = text }; var body: some View { Text(text).font(.caption2.weight(.bold)).tracking(1.1).foregroundStyle(CirclePalette.violet) } }
struct ToastView: View { let message: String; var body: some View { Text(message).font(.subheadline.weight(.semibold)).padding(.horizontal, 16).padding(.vertical, 11).background(.ultraThinMaterial, in: Capsule()).shadow(radius: 12) } }
struct PrimaryButtonStyle: ButtonStyle { func makeBody(configuration: Configuration) -> some View { configuration.label.font(.subheadline.weight(.bold)).padding(.vertical, 14).padding(.horizontal, 16).foregroundStyle(.white).background(CirclePalette.violet.opacity(configuration.isPressed ? 0.78 : 1), in: RoundedRectangle(cornerRadius: 15)).scaleEffect(configuration.isPressed ? 0.98 : 1) } }
struct SecondaryButtonStyle: ButtonStyle { func makeBody(configuration: Configuration) -> some View { configuration.label.font(.subheadline.weight(.semibold)).padding(.vertical, 13).padding(.horizontal, 15).foregroundStyle(CirclePalette.ink).background(.white.opacity(0.84), in: RoundedRectangle(cornerRadius: 15)).overlay(RoundedRectangle(cornerRadius: 15).stroke(CirclePalette.violet.opacity(0.15))) } }
