import SwiftUI

enum CirclePalette {
    static let ink = Color(red: 0.14, green: 0.11, blue: 0.18)
    static let muted = Color(red: 0.40, green: 0.37, blue: 0.45)
    static let violet = Color(red: 0.43, green: 0.18, blue: 0.76)
    static let violetSoft = Color(red: 0.94, green: 0.89, blue: 0.99)
    static let canvas = Color(red: 0.98, green: 0.96, blue: 0.99)
    static let mint = Color(red: 0.78, green: 0.94, blue: 0.87)
    static let rose = Color(red: 0.97, green: 0.82, blue: 0.90)
    static let peach = Color(red: 0.99, green: 0.88, blue: 0.76)

    static func avatar(_ name: String) -> Color {
        switch name {
        case "mint": return mint
        case "peach": return peach
        default: return rose
        }
    }
}
