# Circle iOS demo

Native SwiftUI version of the current Circle demo, tuned for an iPhone screen recording. It uses bundled fixture data and the photos in `Assets.xcassets`; it does not call a model, request photo-library access, record audio, or make network requests for the core demo flow.

## Open and preview

1. Open `CircleDemo.xcodeproj` in Xcode.
2. Select an iPhone 17, iPhone 17 Pro, or another portrait iPhone simulator.
3. Press Run, or open `CircleRootView.swift` and use the included `#Preview` in the canvas.

`project.yml` is included as a project specification for teams that use [XcodeGen](https://github.com/yonaskolb/XcodeGen); the ready-to-open Xcode project is committed, so no generator is needed.

To capture the demo, use Simulator → File → Record Screen.

## Suggested demo sequence
1. On Plan, scroll the compact weekly calendar (note the glowing "AI pick" run club event), then scroll through the event grid of things to do together.
2. In Capture, tap **Scan my photos**, watch the brief scanning animation, then let the full-screen highlight reel auto-advance through real photos. Tap the mic button bottom-right to show the simulated "Listening… → Saved" voice-note sequence.
3. In People, browse the photo grid, then tap a friend to open their detail sheet.

Long-press the **circle.** wordmark (top-left, on any tab) to reset Capture back to its initial gate state so the scan sequence can be replayed for another take.
