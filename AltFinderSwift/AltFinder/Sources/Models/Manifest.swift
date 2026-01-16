import Foundation

/// Represents the .altfinder.json manifest for pinned files
struct AltFinderManifest: Codable {
    var version: Int
    var pinned: [String]

    init(version: Int = 2, pinned: [String] = []) {
        self.version = version
        self.pinned = pinned
    }

    static func load(from directory: URL) -> AltFinderManifest? {
        let manifestURL = directory.appendingPathComponent(".altfinder.json")
        guard FileManager.default.fileExists(atPath: manifestURL.path) else {
            return nil
        }

        do {
            let data = try Data(contentsOf: manifestURL)
            var manifest = try JSONDecoder().decode(AltFinderManifest.self, from: data)

            // Migrate from version 1 if needed
            if manifest.version == 1 {
                manifest.version = 2
                // Version 1 used full paths, version 2 uses filenames only
                manifest.pinned = manifest.pinned.map { path in
                    URL(fileURLWithPath: path).lastPathComponent
                }
            }

            return manifest
        } catch {
            print("Failed to load manifest: \(error)")
            return nil
        }
    }

    func save(to directory: URL) throws {
        let manifestURL = directory.appendingPathComponent(".altfinder.json")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(self)
        try data.write(to: manifestURL)
    }

    mutating func pin(_ filename: String) {
        if !pinned.contains(filename) {
            pinned.append(filename)
        }
    }

    mutating func unpin(_ filename: String) {
        pinned.removeAll { $0 == filename }
    }

    mutating func isPinned(_ filename: String) -> Bool {
        pinned.contains(filename)
    }

    mutating func reorder(from: Int, to: Int) {
        guard from != to,
              from >= 0, from < pinned.count,
              to >= 0, to < pinned.count else { return }

        let item = pinned.remove(at: from)
        pinned.insert(item, at: to)
    }
}
