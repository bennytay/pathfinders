# Circle iOS demo

This is a native SwiftUI demo of Circle, intended for a simulator screen recording. It uses synthetic, in-memory data only and makes no network requests.

## Open and run

1. Open `CircleDemo.xcodeproj` in Xcode, choose an iPhone simulator, and run.

`project.yml` is included as a project specification for teams that use [XcodeGen](https://github.com/yonaskolb/XcodeGen); the ready-to-open Xcode project is committed, so no generator is needed.

For the best recording, use an iPhone 16 or iPhone 16 Pro simulator in portrait.

To capture the demo, use the Simulator menu: **File → New Screen Recording**, interact with Circle, then stop the recording from the menu bar.

## Suggested demo sequence
1. On Plan, scroll the compact weekly calendar (note the glowing "AI pick" run club event), then scroll through the event grid of things to do together.
2. In Capture, tap **Scan my photos**, watch the brief scanning animation, then let the full-screen highlight reel auto-advance through real photos. Tap the mic button bottom-right to show the simulated "Listening… → Saved" voice-note sequence.
3. In People, browse the photo grid, then tap a friend to open their detail sheet.

Long-press the **circle.** wordmark (top-left, on any tab) to reset Capture back to its initial gate state so the scan sequence can be replayed for another take.
