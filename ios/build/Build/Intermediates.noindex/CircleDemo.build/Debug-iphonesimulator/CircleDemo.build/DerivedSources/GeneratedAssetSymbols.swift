import Foundation
#if canImport(DeveloperToolsSupport)
import DeveloperToolsSupport
#endif

#if SWIFT_PACKAGE
private let resourceBundle = Foundation.Bundle.module
#else
private class ResourceBundleClass {}
private let resourceBundle = Foundation.Bundle(for: ResourceBundleClass.self)
#endif

// MARK: - Color Symbols -

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension DeveloperToolsSupport.ColorResource {

}

// MARK: - Image Symbols -

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension DeveloperToolsSupport.ImageResource {

    /// The "arjun-patel" asset catalog image resource.
    static let arjunPatel = DeveloperToolsSupport.ImageResource(name: "arjun-patel", bundle: resourceBundle)

    /// The "beach-soccer" asset catalog image resource.
    static let beachSoccer = DeveloperToolsSupport.ImageResource(name: "beach-soccer", bundle: resourceBundle)

    /// The "beginner-bouldering" asset catalog image resource.
    static let beginnerBouldering = DeveloperToolsSupport.ImageResource(name: "beginner-bouldering", bundle: resourceBundle)

    /// The "birthday-dance" asset catalog image resource.
    static let birthdayDance = DeveloperToolsSupport.ImageResource(name: "birthday-dance", bundle: resourceBundle)

    /// The "book-launch" asset catalog image resource.
    static let bookLaunch = DeveloperToolsSupport.ImageResource(name: "book-launch", bundle: resourceBundle)

    /// The "cafe-night" asset catalog image resource.
    static let cafeNight = DeveloperToolsSupport.ImageResource(name: "cafe-night", bundle: resourceBundle)

    /// The "central-park" asset catalog image resource.
    static let centralPark = DeveloperToolsSupport.ImageResource(name: "central-park", bundle: resourceBundle)

    /// The "clay-social" asset catalog image resource.
    static let claySocial = DeveloperToolsSupport.ImageResource(name: "clay-social", bundle: resourceBundle)

    /// The "figure-drawing" asset catalog image resource.
    static let figureDrawing = DeveloperToolsSupport.ImageResource(name: "figure-drawing", bundle: resourceBundle)

    /// The "foreign-film" asset catalog image resource.
    static let foreignFilm = DeveloperToolsSupport.ImageResource(name: "foreign-film", bundle: resourceBundle)

    /// The "go-karting" asset catalog image resource.
    static let goKarting = DeveloperToolsSupport.ImageResource(name: "go-karting", bundle: resourceBundle)

    /// The "hana-kim" asset catalog image resource.
    static let hanaKim = DeveloperToolsSupport.ImageResource(name: "hana-kim", bundle: resourceBundle)

    /// The "harbour-jazz" asset catalog image resource.
    static let harbourJazz = DeveloperToolsSupport.ImageResource(name: "harbour-jazz", bundle: resourceBundle)

    /// The "haru-sato" asset catalog image resource.
    static let haruSato = DeveloperToolsSupport.ImageResource(name: "haru-sato", bundle: resourceBundle)

    /// The "isla-morgan" asset catalog image resource.
    static let islaMorgan = DeveloperToolsSupport.ImageResource(name: "isla-morgan", bundle: resourceBundle)

    /// The "lounge-candles" asset catalog image resource.
    static let loungeCandles = DeveloperToolsSupport.ImageResource(name: "lounge-candles", bundle: resourceBundle)

    /// The "morning-swim" asset catalog image resource.
    static let morningSwim = DeveloperToolsSupport.ImageResource(name: "morning-swim", bundle: resourceBundle)

    /// The "night-market" asset catalog image resource.
    static let nightMarket = DeveloperToolsSupport.ImageResource(name: "night-market", bundle: resourceBundle)

    /// The "open-mic" asset catalog image resource.
    static let openMic = DeveloperToolsSupport.ImageResource(name: "open-mic", bundle: resourceBundle)

    /// The "park-pilates" asset catalog image resource.
    static let parkPilates = DeveloperToolsSupport.ImageResource(name: "park-pilates", bundle: resourceBundle)

    /// The "pasta-club" asset catalog image resource.
    static let pastaClub = DeveloperToolsSupport.ImageResource(name: "pasta-club", bundle: resourceBundle)

    /// The "pool-night" asset catalog image resource.
    static let poolNight = DeveloperToolsSupport.ImageResource(name: "pool-night", bundle: resourceBundle)

    /// The "postgame" asset catalog image resource.
    static let postgame = DeveloperToolsSupport.ImageResource(name: "postgame", bundle: resourceBundle)

    /// The "priya-shah" asset catalog image resource.
    static let priyaShah = DeveloperToolsSupport.ImageResource(name: "priya-shah", bundle: resourceBundle)

    /// The "record-fair" asset catalog image resource.
    static let recordFair = DeveloperToolsSupport.ImageResource(name: "record-fair", bundle: resourceBundle)

    /// The "rohan-mehta" asset catalog image resource.
    static let rohanMehta = DeveloperToolsSupport.ImageResource(name: "rohan-mehta", bundle: resourceBundle)

    /// The "rooftop-cinema" asset catalog image resource.
    static let rooftopCinema = DeveloperToolsSupport.ImageResource(name: "rooftop-cinema", bundle: resourceBundle)

    /// The "run-club" asset catalog image resource.
    static let runClub = DeveloperToolsSupport.ImageResource(name: "run-club", bundle: resourceBundle)

    /// The "silent-reading" asset catalog image resource.
    static let silentReading = DeveloperToolsSupport.ImageResource(name: "silent-reading", bundle: resourceBundle)

    /// The "social-instagram" asset catalog image resource.
    static let socialInstagram = DeveloperToolsSupport.ImageResource(name: "social-instagram", bundle: resourceBundle)

    /// The "social-snapchat" asset catalog image resource.
    static let socialSnapchat = DeveloperToolsSupport.ImageResource(name: "social-snapchat", bundle: resourceBundle)

    /// The "social-whatsapp" asset catalog image resource.
    static let socialWhatsapp = DeveloperToolsSupport.ImageResource(name: "social-whatsapp", bundle: resourceBundle)

    /// The "social-x" asset catalog image resource.
    static let socialX = DeveloperToolsSupport.ImageResource(name: "social-x", bundle: resourceBundle)

    /// The "spikeball" asset catalog image resource.
    static let spikeball = DeveloperToolsSupport.ImageResource(name: "spikeball", bundle: resourceBundle)

    /// The "sunset-basketball" asset catalog image resource.
    static let sunsetBasketball = DeveloperToolsSupport.ImageResource(name: "sunset-basketball", bundle: resourceBundle)

    /// The "tyler-woodward" asset catalog image resource.
    static let tylerWoodward = DeveloperToolsSupport.ImageResource(name: "tyler-woodward", bundle: resourceBundle)

    /// The "vintage-market" asset catalog image resource.
    static let vintageMarket = DeveloperToolsSupport.ImageResource(name: "vintage-market", bundle: resourceBundle)

    /// The "warehouse-dance" asset catalog image resource.
    static let warehouseDance = DeveloperToolsSupport.ImageResource(name: "warehouse-dance", bundle: resourceBundle)

    /// The "yingying-zhang" asset catalog image resource.
    static let yingyingZhang = DeveloperToolsSupport.ImageResource(name: "yingying-zhang", bundle: resourceBundle)

    /// The "zine-fair" asset catalog image resource.
    static let zineFair = DeveloperToolsSupport.ImageResource(name: "zine-fair", bundle: resourceBundle)

}

