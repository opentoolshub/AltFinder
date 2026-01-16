import Foundation
import AppKit

struct FileItem: Identifiable, Hashable {
    let id: String
    let url: URL
    let name: String
    let isDirectory: Bool
    let isHidden: Bool
    let size: Int64
    let dateModified: Date
    let kind: String
    let icon: NSImage

    var formattedSize: String {
        if isDirectory {
            return "--"
        }
        return ByteCountFormatter.string(fromByteCount: size, countStyle: .file)
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        let calendar = Calendar.current

        if calendar.isDateInToday(dateModified) {
            formatter.dateFormat = "h:mm a"
        } else if calendar.isDate(dateModified, equalTo: Date(), toGranularity: .year) {
            formatter.dateFormat = "MMM d"
        } else {
            formatter.dateFormat = "MMM d, yyyy"
        }
        return formatter.string(from: dateModified)
    }

    init(url: URL) {
        self.id = url.path
        self.url = url
        self.name = url.lastPathComponent

        let resourceValues = try? url.resourceValues(forKeys: [
            .isDirectoryKey,
            .isHiddenKey,
            .fileSizeKey,
            .contentModificationDateKey,
            .localizedTypeDescriptionKey
        ])

        self.isDirectory = resourceValues?.isDirectory ?? false
        self.isHidden = resourceValues?.isHidden ?? url.lastPathComponent.hasPrefix(".")
        self.size = Int64(resourceValues?.fileSize ?? 0)
        self.dateModified = resourceValues?.contentModificationDate ?? Date.distantPast
        self.kind = resourceValues?.localizedTypeDescription ?? (isDirectory ? "Folder" : "Document")
        self.icon = NSWorkspace.shared.icon(forFile: url.path)
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: FileItem, rhs: FileItem) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Sorting
enum SortColumn: String, CaseIterable {
    case name = "Name"
    case dateModified = "Date Modified"
    case size = "Size"
    case kind = "Kind"
}

enum SortOrder {
    case ascending
    case descending

    mutating func toggle() {
        self = self == .ascending ? .descending : .ascending
    }
}

extension Array where Element == FileItem {
    func sorted(by column: SortColumn, order: SortOrder) -> [FileItem] {
        let sorted: [FileItem]
        switch column {
        case .name:
            sorted = self.sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
        case .dateModified:
            sorted = self.sorted { $0.dateModified < $1.dateModified }
        case .size:
            sorted = self.sorted { $0.size < $1.size }
        case .kind:
            sorted = self.sorted { $0.kind.localizedStandardCompare($1.kind) == .orderedAscending }
        }

        // Always keep folders at top, then apply sort order
        let folders = sorted.filter { $0.isDirectory }
        let files = sorted.filter { !$0.isDirectory }

        let sortedFolders = order == .descending ? folders.reversed() : folders
        let sortedFiles = order == .descending ? files.reversed() : files

        return Array(sortedFolders) + Array(sortedFiles)
    }
}
