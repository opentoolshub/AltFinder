import Foundation

enum ClipboardOperation {
    case copy
    case cut
}

struct ClipboardContent {
    let urls: [URL]
    let operation: ClipboardOperation
}

@MainActor
class ClipboardManager: ObservableObject {
    static let shared = ClipboardManager()

    @Published private(set) var content: ClipboardContent?

    var hasContent: Bool { content != nil }

    private init() {}

    func copy(_ urls: [URL]) {
        content = ClipboardContent(urls: urls, operation: .copy)
    }

    func cut(_ urls: [URL]) {
        content = ClipboardContent(urls: urls, operation: .cut)
    }

    func clear() {
        content = nil
    }

    func paste(to destination: URL) async throws {
        guard let content = content else { return }

        let fileManager = FileManager.default

        for sourceURL in content.urls {
            let destURL = destination.appendingPathComponent(sourceURL.lastPathComponent)

            // Handle name conflicts
            let finalURL = uniqueURL(for: destURL)

            switch content.operation {
            case .copy:
                try fileManager.copyItem(at: sourceURL, to: finalURL)
            case .cut:
                try fileManager.moveItem(at: sourceURL, to: finalURL)
            }
        }

        // Clear clipboard after cut operation
        if content.operation == .cut {
            self.content = nil
        }
    }

    private func uniqueURL(for url: URL) -> URL {
        let fileManager = FileManager.default
        var finalURL = url
        var counter = 1

        let filename = url.deletingPathExtension().lastPathComponent
        let ext = url.pathExtension

        while fileManager.fileExists(atPath: finalURL.path) {
            let newFilename = ext.isEmpty
                ? "\(filename) \(counter)"
                : "\(filename) \(counter).\(ext)"
            finalURL = url.deletingLastPathComponent().appendingPathComponent(newFilename)
            counter += 1
        }

        return finalURL
    }
}
