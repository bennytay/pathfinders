import SwiftUI

/// Matches the web app's current dark "ink / violet / canvas" theme
/// (converted from the oklch() values in app/globals.css's final :root block).
enum CirclePalette {
    static let ink = Color(red: 0.932, green: 0.932, blue: 0.956)
    static let muted = Color(red: 0.579, green: 0.580, blue: 0.628)
    static let canvas = Color(red: 0.021, green: 0.020, blue: 0.041)
    static let paper = Color(red: 0.057, green: 0.056, blue: 0.090)
    static let line = Color(red: 0.174, green: 0.174, blue: 0.222)
    static let violet = Color(red: 0.684, green: 0.503, blue: 0.929)
    static let violetDeep = Color(red: 0.778, green: 0.672, blue: 0.943)
    static let violetSoft = Color(red: 0.151, green: 0.104, blue: 0.217)
    static let mint = Color(red: 0.133, green: 0.554, blue: 0.466)
    static let peach = Color(red: 0.997, green: 0.836, blue: 0.700)

    static let toneBlue = Color(red: 0.099, green: 0.515, blue: 0.793)
    static let toneRose = Color(red: 0.776, green: 0.384, blue: 0.584)
    static let toneViolet = Color(red: 0.465, green: 0.346, blue: 0.734)
    static let toneOrange = Color(red: 0.834, green: 0.504, blue: 0.257)
    static let toneGreen = Color(red: 0.000, green: 0.553, blue: 0.398)
}
