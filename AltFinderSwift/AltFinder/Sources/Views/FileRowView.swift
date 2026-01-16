import SwiftUI
import AppKit
import UniformTypeIdentifiers

struct FileRowView: View {
    let item: FileItem
    let isSelected: Bool
    let isPinned: Bool
    let isEditing: Bool
    @Binding var editingName: String
    let onSelect: (NSEvent?) -> Void
    let onOpen: () -> Void
    let onCommitRename: () -> Void

    @State private var isHovering = false
    @FocusState private var isNameFieldFocused: Bool

    var body: some View {
        HStack(spacing: 0) {
            // Icon
            Image(nsImage: item.icon)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 20, height: 20)
                .padding(.horizontal, 6)

            // Name
            Group {
                if isEditing {
                    TextField("", text: $editingName, onCommit: onCommitRename)
                        .textFieldStyle(.plain)
                        .focused($isNameFieldFocused)
                        .onAppear { isNameFieldFocused = true }
                        .onExitCommand { onCommitRename() }
                } else {
                    HStack(spacing: 4) {
                        Text(item.name)
                            .lineLimit(1)
                            .truncationMode(.middle)

                        if isPinned {
                            Image(systemName: "pin.fill")
                                .font(.system(size: 9))
                                .foregroundColor(.orange)
                        }
                    }
                }
            }
            .frame(minWidth: 200, alignment: .leading)

            Spacer()

            // Date Modified
            Text(item.formattedDate)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .frame(width: 140, alignment: .leading)

            // Size
            Text(item.formattedSize)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .frame(width: 80, alignment: .trailing)

            // Kind
            Text(item.kind)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .lineLimit(1)
                .frame(width: 120, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(
            isSelected
                ? Color.accentColor.opacity(0.3)
                : (isHovering ? Color.gray.opacity(0.1) : Color.clear)
        )
        .contentShape(Rectangle())
        .onHover { isHovering = $0 }
        .onTapGesture(count: 2) {
            onOpen()
        }
        .simultaneousGesture(
            TapGesture(count: 1)
                .onEnded { _ in
                    onSelect(NSApp.currentEvent)
                }
        )
        .draggable(item.url)
    }
}

// MARK: - Drop Support

extension FileRowView {
    func onDrop(of types: [UTType], isTargeted: Binding<Bool>?, perform action: @escaping ([NSItemProvider]) -> Bool) -> some View {
        self.modifier(DropTargetModifier(isDirectory: item.isDirectory, url: item.url, isTargeted: isTargeted, action: action))
    }
}

struct DropTargetModifier: ViewModifier {
    let isDirectory: Bool
    let url: URL
    let isTargeted: Binding<Bool>?
    let action: ([NSItemProvider]) -> Bool

    func body(content: Content) -> some View {
        if isDirectory {
            content.dropDestination(for: URL.self) { urls, _ in
                let fileManager = FileManager.default
                for sourceURL in urls {
                    let destURL = url.appendingPathComponent(sourceURL.lastPathComponent)
                    try? fileManager.moveItem(at: sourceURL, to: destURL)
                }
                return true
            } isTargeted: { targeted in
                isTargeted?.wrappedValue = targeted
            }
        } else {
            content
        }
    }
}
