import SwiftUI
import Combine

@MainActor
class AppState: ObservableObject {
    @Published var currentPath: URL
    @Published var showHiddenFiles: Bool {
        didSet {
            UserDefaults.standard.set(showHiddenFiles, forKey: "showHiddenFiles")
        }
    }
    @Published var sidebarVisible: Bool = true

    // Navigation history
    @Published private(set) var historyStack: [URL] = []
    @Published private(set) var historyIndex: Int = -1

    var canGoBack: Bool { historyIndex > 0 }
    var canGoForward: Bool { historyIndex < historyStack.count - 1 }

    init() {
        // Load saved state or use defaults
        let savedPath = UserDefaults.standard.string(forKey: "lastPath")
        if let saved = savedPath, FileManager.default.fileExists(atPath: saved) {
            self.currentPath = URL(fileURLWithPath: saved)
        } else {
            self.currentPath = FileManager.default.homeDirectoryForCurrentUser
        }

        self.showHiddenFiles = UserDefaults.standard.bool(forKey: "showHiddenFiles")

        // Initialize history with current path
        self.historyStack = [currentPath]
        self.historyIndex = 0
    }

    func navigateTo(_ url: URL) {
        guard url != currentPath else { return }

        // If we're not at the end of history, truncate forward history
        if historyIndex < historyStack.count - 1 {
            historyStack = Array(historyStack[0...historyIndex])
        }

        historyStack.append(url)
        historyIndex = historyStack.count - 1
        currentPath = url

        // Save last path
        UserDefaults.standard.set(url.path, forKey: "lastPath")
    }

    func goBack() {
        guard canGoBack else { return }
        historyIndex -= 1
        currentPath = historyStack[historyIndex]
        UserDefaults.standard.set(currentPath.path, forKey: "lastPath")
    }

    func goForward() {
        guard canGoForward else { return }
        historyIndex += 1
        currentPath = historyStack[historyIndex]
        UserDefaults.standard.set(currentPath.path, forKey: "lastPath")
    }

    func goUp() {
        let parent = currentPath.deletingLastPathComponent()
        if parent != currentPath {
            navigateTo(parent)
        }
    }
}
