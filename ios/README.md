# Circle iOS demo

Native SwiftUI version of the current Circle demo, tuned for an iPhone screen recording. It uses bundled fixture data and the photos in `Assets.xcassets`; it does not call a model, request photo-library access, record audio, or make network requests for the core demo flow.

## Open and preview

1. Open `CircleDemo.xcodeproj` in Xcode.
2. Select an iPhone 17, iPhone 17 Pro, or another portrait iPhone simulator.
3. Press Run, or open `CircleRootView.swift` and use the included `#Preview` in the canvas.

`project.yml` is included as a project specification for teams that use [XcodeGen](https://github.com/yonaskolb/XcodeGen); the ready-to-open Xcode project is committed, so no generator is needed.

To capture the demo, use Simulator → File → Record Screen.

## Suggested demo sequence
1. On Plan, check the compact weekly calendar, then browse the event grid. Tap an event card for the detail. Open **Map** in the leftmost glass navigation item to pan around nearby events, tap a numbered neighbourhood pin, and pull up the events drawer for the full category grid.
2. In Capture, tap **Give access to full library**, choose **Allow Full Access** in the simulated permission prompt, then watch the brief scanning animation. The full-screen highlight reel then auto-advances through real photos.
3. In People, browse the photo grid, then tap a friend to open their detail sheet.

Long-press the **circle.** wordmark (top-left, on any tab) to reset Capture back to its initial gate state so the scan sequence can be replayed for another take.
