import SwiftUI

struct ToolbarView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var viewModel: FileSystemViewModel

    var body: some View {
        HStack(spacing: 12) {
            // Navigation buttons
            HStack(spacing: 4) {
                Button(action: { appState.goBack() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .medium))
                }
                .buttonStyle(.borderless)
                .disabled(!appState.canGoBack)
                .help("Back")

                Button(action: { appState.goForward() }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .medium))
                }
                .buttonStyle(.borderless)
                .disabled(!appState.canGoForward)
                .help("Forward")
            }

            Divider()
                .frame(height: 20)

            // View options
            HStack(spacing: 8) {
                Toggle(isOn: $appState.showHiddenFiles) {
                    Image(systemName: "eye")
                        .font(.system(size: 14))
                }
                .toggleStyle(.button)
                .buttonStyle(.borderless)
                .help(appState.showHiddenFiles ? "Hide Hidden Files" : "Show Hidden Files")
            }

            Spacer()

            // Search field
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search", text: $viewModel.searchText)
                    .textFieldStyle(.plain)
                    .frame(width: 150)

                if !viewModel.searchText.isEmpty {
                    Button(action: { viewModel.searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.borderless)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(6)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }
}
