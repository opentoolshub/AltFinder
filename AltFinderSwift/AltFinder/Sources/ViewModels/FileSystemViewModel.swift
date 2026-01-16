import Foundation
import Combine
import AppKit

@MainActor
class FileSystemViewModel: ObservableObject {
    @Published var items: [FileItem] = []
    @Published var pinnedItems: [FileItem] = []
    @Published var unpinnedItems: [FileItem] = []
    @Published var selectedItems: Set<FileItem> = []
    @Published var sortColumn: SortColumn = .name
    @Published var sortOrder: SortOrder = .ascending
    @Published var searchText: String = ""
    @Published var isLoading: Bool = false
    @Published var error: String?

    private var manifest: AltFinderManifest?
    private var currentDirectory: URL?
    private var fileMonitor: DispatchSourceFileSystemObject?
    private var monitoredFD: Int32 = -1

    var filteredPinnedItems: [FileItem] {
        guard !searchText.isEmpty else { return pinnedItems }
        return pinnedItems.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    var filteredUnpinnedItems: [FileItem] {
        guard !searchText.isEmpty else { return unpinnedItems }
        return unpinnedItems.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    func loadDirectory(_ url: URL, showHidden: Bool) {
        currentDirectory = url
        isLoading = true
        error = nil

        // Stop existing monitor
        stopMonitoring()

        Task {
            do {
                let fileManager = FileManager.default

                // Load manifest
                manifest = AltFinderManifest.load(from: url)

                // Get directory contents
                let contents = try fileManager.contentsOfDirectory(
                    at: url,
                    includingPropertiesForKeys: [
                        .isDirectoryKey,
                        .isHiddenKey,
                        .fileSizeKey,
                        .contentModificationDateKey,
                        .localizedTypeDescriptionKey
                    ],
                    options: showHidden ? [] : [.skipsHiddenFiles]
                )

                var allItems = contents.map { FileItem(url: $0) }

                // Filter out .altfinder.json from display
                allItems = allItems.filter { $0.name != ".altfinder.json" }

                // Sort items
                allItems = allItems.sorted(by: sortColumn, order: sortOrder)

                // Separate pinned and unpinned
                let pinnedNames = Set(manifest?.pinned ?? [])
                let pinned = allItems.filter { pinnedNames.contains($0.name) }
                let unpinned = allItems.filter { !pinnedNames.contains($0.name) }

                // Sort pinned items by their order in manifest
                let sortedPinned = pinned.sorted { a, b in
                    let indexA = manifest?.pinned.firstIndex(of: a.name) ?? Int.max
                    let indexB = manifest?.pinned.firstIndex(of: b.name) ?? Int.max
                    return indexA < indexB
                }

                await MainActor.run {
                    self.items = allItems
                    self.pinnedItems = sortedPinned
                    self.unpinnedItems = unpinned
                    self.isLoading = false
                }

                // Start monitoring for changes
                startMonitoring(url: url, showHidden: showHidden)

            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }

    func resort() {
        let sorted = items.sorted(by: sortColumn, order: sortOrder)
        let pinnedNames = Set(manifest?.pinned ?? [])

        pinnedItems = sorted.filter { pinnedNames.contains($0.name) }.sorted { a, b in
            let indexA = manifest?.pinned.firstIndex(of: a.name) ?? Int.max
            let indexB = manifest?.pinned.firstIndex(of: b.name) ?? Int.max
            return indexA < indexB
        }
        unpinnedItems = sorted.filter { !pinnedNames.contains($0.name) }
    }

    func toggleSort(column: SortColumn) {
        if sortColumn == column {
            sortOrder.toggle()
        } else {
            sortColumn = column
            sortOrder = .ascending
        }
        resort()
    }

    // MARK: - Pinning

    func togglePin(_ item: FileItem) {
        guard let directory = currentDirectory else { return }

        var manifest = self.manifest ?? AltFinderManifest()

        if manifest.isPinned(item.name) {
            manifest.unpin(item.name)
        } else {
            manifest.pin(item.name)
        }

        do {
            try manifest.save(to: directory)
            self.manifest = manifest
            resort()
        } catch {
            self.error = "Failed to update pinned items: \(error.localizedDescription)"
        }
    }

    func isPinned(_ item: FileItem) -> Bool {
        manifest?.pinned.contains(item.name) ?? false
    }

    // MARK: - File Operations

    func createNewFolder() async throws {
        guard let directory = currentDirectory else { return }

        let fileManager = FileManager.default
        var folderName = "untitled folder"
        var counter = 1
        var folderURL = directory.appendingPathComponent(folderName)

        while fileManager.fileExists(atPath: folderURL.path) {
            folderName = "untitled folder \(counter)"
            folderURL = directory.appendingPathComponent(folderName)
            counter += 1
        }

        try fileManager.createDirectory(at: folderURL, withIntermediateDirectories: false)
    }

    func delete(_ items: [FileItem]) async throws {
        for item in items {
            try FileManager.default.trashItem(at: item.url, resultingItemURL: nil)
        }
    }

    func rename(_ item: FileItem, to newName: String) async throws {
        let newURL = item.url.deletingLastPathComponent().appendingPathComponent(newName)
        try FileManager.default.moveItem(at: item.url, to: newURL)

        // Update manifest if item was pinned
        if var manifest = manifest, manifest.isPinned(item.name) {
            manifest.unpin(item.name)
            manifest.pin(newName)
            try manifest.save(to: currentDirectory!)
            self.manifest = manifest
        }
    }

    func openItem(_ item: FileItem) {
        if item.isDirectory {
            // Navigation handled by ContentView
        } else {
            NSWorkspace.shared.open(item.url)
        }
    }

    func revealInFinder(_ item: FileItem) {
        NSWorkspace.shared.activateFileViewerSelecting([item.url])
    }

    func openWith(_ item: FileItem) {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = false
        panel.directoryURL = URL(fileURLWithPath: "/Applications")
        panel.allowedContentTypes = [.application]
        panel.message = "Choose an application to open \(item.name)"

        if panel.runModal() == .OK, let appURL = panel.url {
            NSWorkspace.shared.open(
                [item.url],
                withApplicationAt: appURL,
                configuration: NSWorkspace.OpenConfiguration()
            )
        }
    }

    // MARK: - File System Monitoring

    private func startMonitoring(url: URL, showHidden: Bool) {
        let fd = open(url.path, O_EVTONLY)
        guard fd >= 0 else { return }

        monitoredFD = fd
        let source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fd,
            eventMask: [.write, .delete, .rename],
            queue: .main
        )

        source.setEventHandler { [weak self] in
            self?.loadDirectory(url, showHidden: showHidden)
        }

        source.setCancelHandler {
            close(fd)
        }

        source.resume()
        fileMonitor = source
    }

    private func stopMonitoring() {
        fileMonitor?.cancel()
        fileMonitor = nil
        if monitoredFD >= 0 {
            close(monitoredFD)
            monitoredFD = -1
        }
    }

    deinit {
        fileMonitor?.cancel()
        if monitoredFD >= 0 {
            close(monitoredFD)
        }
    }
}
