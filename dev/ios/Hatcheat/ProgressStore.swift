import Foundation

struct Progress: Codable, Equatable {
    var version: Int
    var turns: Int
    var collection: [String]
    var book: String
    var sound: Bool
    static let empty = Progress(version: 1, turns: 0, collection: [], book: "random", sound: true)
}

final class ProgressStore {
    static let key = "hatcheat.progress.v1"
    private let defaults: UserDefaults
    private let books: Set<String>
    private let quotes: Set<String>

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let url = Bundle.main.url(forResource: "catalog", withExtension: "json", subdirectory: "Web")!
        let catalog = try! JSONDecoder().decode([String: [String]].self, from: Data(contentsOf: url))
        books = Set(catalog["books"] ?? [])
        quotes = Set(catalog["quotes"] ?? [])
    }

    func validated(_ data: Data) -> Progress? {
        guard let value = try? JSONDecoder().decode(Progress.self, from: data),
              value.version == 1, (0..<100).contains(value.turns),
              books.contains(value.book), value.collection.allSatisfy(quotes.contains) else { return nil }
        return value
    }

    var json: String {
        let progress = defaults.data(forKey: Self.key).flatMap(validated) ?? .empty
        return String(data: try! JSONEncoder().encode(progress), encoding: .utf8)!
    }

    var soundEnabled: Bool {
        defaults.data(forKey: Self.key).flatMap(validated)?.sound ?? true
    }

    @discardableResult
    func save(_ payload: String) -> Bool {
        guard let data = payload.data(using: .utf8), let progress = validated(data),
              let encoded = try? JSONEncoder().encode(progress) else { return false }
        // Re-encoding the typed model drops all unrecognised fields, including any draft.
        defaults.set(encoded, forKey: Self.key)
        return true
    }
}
