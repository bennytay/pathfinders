import Foundation

/// A deterministic, rules-based reel ranker — a Swift port of the same
/// algorithm implemented for the web demo (lib/reel-ranking.ts) before that
/// app was retired. A star is the only preference signal; there is no
/// dislike/downvote, and nothing here is machine-learned.
enum ReelRanking {
    enum FeatureKind {
        case companion, place, time, day
    }

    struct Feature {
        let key: String
        let kind: FeatureKind
        let value: String
    }

    struct Contributor {
        let kind: FeatureKind
        let value: String
        let weight: Double
    }

    enum Reason {
        case coldStart
        case exploration
        case nostalgia
        case preference(contributors: [Contributor])
    }

    struct Ranked {
        let highlight: Highlight
        let score: Double
        let reason: Reason
    }

    private static var utcCalendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }()

    private static func timeBucket(_ hour: Int) -> String {
        if hour < 6 { return "night" }
        if hour < 12 { return "morning" }
        if hour < 18 { return "afternoon" }
        return "evening"
    }

    /// Only non-sensitive, local, user-correctable signals: confirmed
    /// companions, coarse place, and capture-time buckets.
    static func features(for highlight: Highlight) -> [Feature] {
        var features = highlight.friendIds.map { Feature(key: "companion:\($0)", kind: .companion, value: $0) }
        features.append(Feature(key: "place:\(highlight.place)", kind: .place, value: highlight.place))
        let hour = utcCalendar.component(.hour, from: highlight.capturedAt)
        let bucket = timeBucket(hour)
        features.append(Feature(key: "time:\(bucket)", kind: .time, value: bucket))
        let weekday = utcCalendar.component(.weekday, from: highlight.capturedAt)
        let dayValue = (weekday == 1 || weekday == 7) ? "weekend" : "weekday"
        features.append(Feature(key: "day:\(dayValue)", kind: .day, value: dayValue))
        return features
    }

    /// weight(f) = log(1 + starredPhotosContaining(f)) / log(1 + totalStarredPhotos)
    /// A feature only enters the profile once at least two starred photos
    /// share it, so a single one-off star saves that photo without
    /// reshaping the whole reel.
    static func computeWeights(highlights: [Highlight], starredIDs: Set<String>) -> (weights: [String: Double], confidence: Double) {
        let starred = highlights.filter { starredIDs.contains($0.id) }
        let total = starred.count
        var counts: [String: Int] = [:]
        for highlight in starred {
            for feature in features(for: highlight) { counts[feature.key, default: 0] += 1 }
        }
        var weights: [String: Double] = [:]
        if total > 0 {
            for (key, count) in counts where count >= 2 {
                weights[key] = log(1 + Double(count)) / log(1 + Double(total))
            }
        }
        // confidence = min(1, totalStarredPhotos / 8) — avoids overfitting the whole reel to one new star.
        let confidence = min(1, Double(total) / 8)
        return (weights, confidence)
    }

    // A stable hash, not arc4random, so the same photo always lands in the
    // same exploration slot for a given session.
    private static func hash(_ value: String) -> UInt32 {
        var hash: UInt32 = 0
        for byte in value.utf8 { hash = hash &* 31 &+ UInt32(byte) }
        return hash
    }

    // Reserve roughly one in eight positions for a photo that isn't strongly predicted by the profile.
    private static func isExplorationSlot(_ highlight: Highlight) -> Bool {
        hash(highlight.id) % 8 == 0
    }

    private static func dayOfYear(_ date: Date) -> Int {
        utcCalendar.ordinality(of: .day, in: .year, for: date) ?? 0
    }

    // Gently surfaces "around this week, a previous year" without overwhelming starred preferences.
    private static func nostalgiaFit(_ highlight: Highlight, asOf: Date) -> Double {
        guard highlight.capturedAt <= asOf else { return 0 }
        let capturedYear = utcCalendar.component(.year, from: highlight.capturedAt)
        let asOfYear = utcCalendar.component(.year, from: asOf)
        guard asOfYear != capturedYear else { return 0 }
        return abs(dayOfYear(asOf) - dayOfYear(highlight.capturedAt)) <= 10 ? 1 : 0
    }

    static func score(_ highlight: Highlight, weights: [String: Double], confidence: Double, asOf: Date) -> (score: Double, contributors: [Contributor]) {
        let feats = features(for: highlight)
        let matched = feats.compactMap { feature -> Contributor? in
            guard let weight = weights[feature.key], weight > 0 else { return nil }
            return Contributor(kind: feature.kind, value: feature.value, weight: weight)
        }
        let preferenceMatch = feats.isEmpty ? 0 : matched.reduce(0) { $0 + $1.weight } / Double(feats.count)
        let photoQuality = 1.0
        let exploration = isExplorationSlot(highlight) ? 1.0 : 0.0
        let total = 0.55 * confidence * preferenceMatch + 0.2 * nostalgiaFit(highlight, asOf: asOf) + 0.15 * photoQuality + 0.1 * exploration
        return (total, matched)
    }

    private static func reason(for highlight: Highlight, contributors: [Contributor], asOf: Date) -> Reason {
        if !contributors.isEmpty { return .preference(contributors: contributors) }
        if nostalgiaFit(highlight, asOf: asOf) > 0 { return .nostalgia }
        if isExplorationSlot(highlight) { return .exploration }
        return .coldStart
    }

    /// Deterministic: identical highlights + stars + asOf always produce the
    /// same order and reasons. A diversity pass avoids showing the same
    /// place back-to-back when an alternative exists.
    static func rank(highlights: [Highlight], starredIDs: Set<String>, asOf: Date = Date()) -> [Ranked] {
        let (weights, confidence) = computeWeights(highlights: highlights, starredIDs: starredIDs)
        var scored = highlights.map { highlight -> Ranked in
            let (score, contributors) = score(highlight, weights: weights, confidence: confidence, asOf: asOf)
            return Ranked(highlight: highlight, score: score, reason: reason(for: highlight, contributors: contributors, asOf: asOf))
        }
        scored.sort { lhs, rhs in
            lhs.score != rhs.score ? lhs.score > rhs.score : lhs.highlight.id < rhs.highlight.id
        }

        var remaining = scored
        var ordered: [Ranked] = []
        while !remaining.isEmpty {
            let previousPlace = ordered.last?.highlight.place
            let index = remaining.firstIndex { previousPlace == nil || $0.highlight.place != previousPlace } ?? 0
            ordered.append(remaining.remove(at: index))
        }
        return ordered
    }

    static func explain(_ reason: Reason, friendName: (String) -> String) -> String {
        switch reason {
        case .coldStart:
            return "A recent memory, shown for variety."
        case .exploration:
            return "A change of pace from what you usually star."
        case .nostalgia:
            return "From around this time, a previous year."
        case .preference(let contributors):
            let top = contributors.sorted { $0.weight > $1.weight }.prefix(2)
            let parts = top.map { contributor -> String in
                switch contributor.kind {
                case .companion: return "photos with \(friendName(contributor.value))"
                case .place: return "photos at \(contributor.value)"
                case .time, .day: return "\(contributor.value) photos"
                }
            }
            return "You starred several \(parts.joined(separator: " and "))."
        }
    }
}
