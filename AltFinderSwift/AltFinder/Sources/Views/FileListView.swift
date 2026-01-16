import SwiftUI
import AppKit

struct FileListView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var viewModel: FileSystemViewModel
    @StateObject private var clipboard = ClipboardManager.shared

    @State private var editingItem: FileItem?
    @State private var editingName: String = ""

    var body: some View {
        VStack(spacing: 0) {
            // Column headers
            FileListHeader(viewModel: viewModel)

            Divider()

            // File list
            if viewModel.isLoading {
                Spacer()
                ProgressView()
                    .progressViewStyle(.circular)
                Spacer()
            } else if let error = viewModel.error {
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.secondary)
                    Text(error)
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        // Pinned section
                        if !viewModel.filteredPinnedItems.isEmpty {
                            SectionHeader(title: "Pinned")
                            ForEach(viewModel.filteredPinnedItems) { item in
                                FileRowView(
                                    item: item,
                                    isSelected: viewModel.selectedItems.contains(item),
                                    isPinned: true,
                                    isEditing: editingItem == item,
                                    editingName: $editingName,
                                    onSelect: { handleSelection(item: item, event: $0) },
                                    onOpen: { handleOpen(item) },
                                    onCommitRename: { commitRename(item) }
                                )
                                .contextMenu { contextMenu(for: item) }
                            }
                        }

                        // Regular files
                        if !viewModel.filteredUnpinnedItems.isEmpty {
                            if !viewModel.filteredPinnedItems.isEmpty {
                                SectionHeader(title: "Files")
                            }
                            ForEach(viewModel.filteredUnpinnedItems) { item in
                                FileRowView(
                                    item: item,
                                    isSelected: viewModel.selectedItems.contains(item),
                                    isPinned: false,
                                    isEditing: editingItem == item,
                                    editingName: $editingName,
                                    onSelect: { handleSelection(item: item, event: $0) },
                                    onOpen: { handleOpen(item) },
                                    onCommitRename: { commitRename(item) }
                                )
                                .contextMenu { contextMenu(for: item) }
                            }
                        }

                        // Empty state
                        if viewModel.filteredPinnedItems.isEmpty && viewModel.filteredUnpinnedItems.isEmpty {
                            VStack(spacing: 8) {
                                Image(systemName: "folder")
                                    .font(.system(size: 48))
                                    .foregroundColor(.secondary)
                                Text(viewModel.searchText.isEmpty ? "Empty Folder" : "No Results")
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 60)
                        }
                    }
                }
                .background(Color(NSColor.controlBackgroundColor))
            }
        }
        .onKeyPress(.delete) {
            deleteSelectedItems()
            return .handled
        }
        .onKeyPress(.return) {
            if let item = viewModel.selectedItems.first, viewModel.selectedItems.count == 1 {
                startRenaming(item)
            }
            return .handled
        }
    }

    // MARK: - Selection Handling

    private func handleSelection(item: FileItem, event: NSEvent?) {
        let modifiers = event?.modifierFlags ?? []

        if modifiers.contains(.command) {
            // Toggle selection
            if viewModel.selectedItems.contains(item) {
                viewModel.selectedItems.remove(item)
            } else {
                viewModel.selectedItems.insert(item)
            }
        } else if modifiers.contains(.shift) {
            // Range selection (simplified - just add to selection)
            viewModel.selectedItems.insert(item)
        } else {
            // Single selection
            viewModel.selectedItems = [item]
        }
    }

    private func handleOpen(_ item: FileItem) {
        if item.isDirectory {
            appState.navigateTo(item.url)
        } else {
            viewModel.openItem(item)
        }
    }

    // MARK: - Context Menu

    @ViewBuilder
    private func contextMenu(for item: FileItem) -> some View {
        Button("Open") {
            handleOpen(item)
        }

        Button("Open With...") {
            viewModel.openWith(item)
        }

        Divider()

        Button(viewModel.isPinned(item) ? "Unpin" : "Pin to Top") {
            viewModel.togglePin(item)
        }

        Divider()

        Button("Copy") {
            clipboard.copy(Array(viewModel.selectedItems.isEmpty ? [item] : viewModel.selectedItems).map(\.url))
        }

        Button("Cut") {
            clipboard.cut(Array(viewModel.selectedItems.isEmpty ? [item] : viewModel.selectedItems).map(\.url))
        }

        if clipboard.hasContent {
            Button("Paste") {
                Task {
                    try? await clipboard.paste(to: appState.currentPath)
                }
            }
        }

        Divider()

        Button("Rename...") {
            startRenaming(item)
        }

        Button("Move to Trash") {
            deleteSelectedItems()
        }
        .keyboardShortcut(.delete, modifiers: [])

        Divider()

        Button("Reveal in Finder") {
            viewModel.revealInFinder(item)
        }

        Button("Get Info") {
            NSWorkspace.shared.activateFileViewerSelecting([item.url])
        }
    }

    // MARK: - Actions

    private func startRenaming(_ item: FileItem) {
        editingItem = item
        editingName = item.name
    }

    private func commitRename(_ item: FileItem) {
        guard !editingName.isEmpty, editingName != item.name else {
            editingItem = nil
            return
        }

        Task {
            try? await viewModel.rename(item, to: editingName)
            editingItem = nil
        }
    }

    private func deleteSelectedItems() {
        let items = viewModel.selectedItems.isEmpty ? [] : Array(viewModel.selectedItems)
        guard !items.isEmpty else { return }

        Task {
            try? await viewModel.delete(items)
            viewModel.selectedItems.removeAll()
        }
    }
}

// MARK: - Column Header

struct FileListHeader: View {
    @ObservedObject var viewModel: FileSystemViewModel

    var body: some View {
        HStack(spacing: 0) {
            // Icon column (fixed width)
            Color.clear.frame(width: 32)

            // Name column
            ColumnHeader(title: "Name", column: .name, viewModel: viewModel)
                .frame(minWidth: 200)

            Spacer()

            // Date Modified
            ColumnHeader(title: "Date Modified", column: .dateModified, viewModel: viewModel)
                .frame(width: 140)

            // Size
            ColumnHeader(title: "Size", column: .size, viewModel: viewModel)
                .frame(width: 80)

            // Kind
            ColumnHeader(title: "Kind", column: .kind, viewModel: viewModel)
                .frame(width: 120)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

struct ColumnHeader: View {
    let title: String
    let column: SortColumn
    @ObservedObject var viewModel: FileSystemViewModel

    var body: some View {
        Button(action: {
            viewModel.toggleSort(column: column)
        }) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)

                if viewModel.sortColumn == column {
                    Image(systemName: viewModel.sortOrder == .ascending ? "chevron.up" : "chevron.down")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(NSColor.windowBackgroundColor).opacity(0.8))
    }
}
