import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = FileSystemViewModel()
    @StateObject private var clipboard = ClipboardManager.shared

    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            SidebarView()
                .environmentObject(appState)
        } detail: {
            VStack(spacing: 0) {
                ToolbarView(viewModel: viewModel)
                    .environmentObject(appState)

                PathBarView()
                    .environmentObject(appState)

                Divider()

                FileListView(viewModel: viewModel)
                    .environmentObject(appState)
            }
        }
        .navigationSplitViewStyle(.balanced)
        .frame(minWidth: 700, minHeight: 400)
        .onChange(of: appState.currentPath) { _, newPath in
            viewModel.loadDirectory(newPath, showHidden: appState.showHiddenFiles)
        }
        .onChange(of: appState.showHiddenFiles) { _, showHidden in
            viewModel.loadDirectory(appState.currentPath, showHidden: showHidden)
        }
        .onAppear {
            viewModel.loadDirectory(appState.currentPath, showHidden: appState.showHiddenFiles)
        }
        .onReceive(NotificationCenter.default.publisher(for: .createNewFolder)) { _ in
            Task {
                try? await viewModel.createNewFolder()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .selectAll)) { _ in
            viewModel.selectedItems = Set(viewModel.items)
        }
        .onReceive(NotificationCenter.default.publisher(for: .toggleSidebar)) { _ in
            withAnimation {
                columnVisibility = columnVisibility == .all ? .detailOnly : .all
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateBack)) { _ in
            appState.goBack()
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateForward)) { _ in
            appState.goForward()
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateUp)) { _ in
            appState.goUp()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
