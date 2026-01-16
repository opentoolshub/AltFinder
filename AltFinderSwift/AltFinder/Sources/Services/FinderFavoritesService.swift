import Foundation
import Combine

struct FavoriteItem: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let url: URL
    let icon: String

    init(name: String, url: URL, icon: String = "folder") {
        self.name = name
        self.url = url
        self.icon = icon
    }
}

@MainActor
class FinderFavoritesService: ObservableObject {
    static let shared = FinderFavoritesService()

    @Published private(set) var favorites: [FavoriteItem] = []
    @Published private(set) var isLoading = false

    private var fileMonitor: DispatchSourceFileSystemObject?
    private var monitoredFD: Int32 = -1

    private init() {
        loadFavorites()
        setupFileWatcher()
    }

    func loadFavorites() {
        isLoading = true

        Task {
            let loaded = await loadFinderFavorites()
            await MainActor.run {
                self.favorites = loaded
                self.isLoading = false
            }
        }
    }

    private func loadFinderFavorites() async -> [FavoriteItem] {
        // Path to Finder favorites - try sfl4 first (macOS 26+), then sfl3 (older)
        let basePath = NSHomeDirectory() + "/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.FavoriteItems"
        let paths = [basePath + ".sfl4", basePath + ".sfl3"]

        var data: Data?
        for path in paths {
            if let fileData = FileManager.default.contents(atPath: path) {
                data = fileData
                break
            }
        }

        guard let data = data else {
            return getDefaultFavorites()
        }

        // Try to unarchive the plist
        guard let plist = try? NSKeyedUnarchiver.unarchivedObject(
            ofClasses: [NSDictionary.self, NSArray.self, NSString.self, NSData.self, NSUUID.self, NSNumber.self],
            from: data
        ) as? NSDictionary else {
            return getDefaultFavorites()
        }

        guard let items = plist["items"] as? NSArray else {
            return getDefaultFavorites()
        }

        var favorites: [FavoriteItem] = []

        for item in items {
            guard let itemDict = item as? NSDictionary,
                  let bookmarkData = itemDict["Bookmark"] as? Data else {
                continue
            }

            var isStale = false
            if let url = try? URL(resolvingBookmarkData: bookmarkData, options: .withoutUI, relativeTo: nil, bookmarkDataIsStale: &isStale) {
                // Skip special items like canned searches
                if url.path.contains(".cannedSearch") {
                    continue
                }

                let name = url.lastPathComponent
                let icon = iconForPath(url)
                favorites.append(FavoriteItem(name: name, url: url, icon: icon))
            }
        }

        // If we got no favorites, return defaults
        if favorites.isEmpty {
            return getDefaultFavorites()
        }

        return favorites
    }

    private func getDefaultFavorites() -> [FavoriteItem] {
        let home = FileManager.default.homeDirectoryForCurrentUser
        var defaults: [FavoriteItem] = []

        // Desktop
        let desktop = home.appendingPathComponent("Desktop")
        if FileManager.default.fileExists(atPath: desktop.path) {
            defaults.append(FavoriteItem(name: "Desktop", url: desktop, icon: "display"))
        }

        // Documents
        let documents = home.appendingPathComponent("Documents")
        if FileManager.default.fileExists(atPath: documents.path) {
            defaults.append(FavoriteItem(name: "Documents", url: documents, icon: "doc.text"))
        }

        // Downloads
        let downloads = home.appendingPathComponent("Downloads")
        if FileManager.default.fileExists(atPath: downloads.path) {
            defaults.append(FavoriteItem(name: "Downloads", url: downloads, icon: "arrow.down.circle"))
        }

        // Applications
        let apps = URL(fileURLWithPath: "/Applications")
        if FileManager.default.fileExists(atPath: apps.path) {
            defaults.append(FavoriteItem(name: "Applications", url: apps, icon: "square.grid.2x2"))
        }

        return defaults
    }

    private func iconForPath(_ url: URL) -> String {
        let name = url.lastPathComponent.lowercased()

        // Common folder icons
        switch name {
        case "desktop": return "display"
        case "documents": return "doc.text"
        case "downloads": return "arrow.down.circle"
        case "applications": return "square.grid.2x2"
        case "movies": return "film"
        case "music": return "music.note"
        case "pictures", "photos": return "photo"
        case "library": return "books.vertical"
        case "code", "developer", "projects": return "chevron.left.forwardslash.chevron.right"
        default: return "folder"
        }
    }

    private func setupFileWatcher() {
        let favoritesDir = NSHomeDirectory() + "/Library/Application Support/com.apple.sharedfilelist"

        let fd = open(favoritesDir, O_EVTONLY)
        guard fd >= 0 else { return }

        monitoredFD = fd
        let source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fd,
            eventMask: [.write, .delete, .rename],
            queue: .main
        )

        source.setEventHandler { [weak self] in
            // Debounce by waiting a moment for file to settle
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self?.loadFavorites()
            }
        }

        source.setCancelHandler {
            close(fd)
        }

        source.resume()
        fileMonitor = source
    }

    deinit {
        fileMonitor?.cancel()
        if monitoredFD >= 0 {
            close(monitoredFD)
        }
    }
}
