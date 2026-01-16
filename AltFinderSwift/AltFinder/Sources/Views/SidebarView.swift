import SwiftUI

struct SidebarView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var favoritesService = FinderFavoritesService.shared

    var body: some View {
        List(selection: Binding(
            get: { appState.currentPath },
            set: { if let url = $0 { appState.navigateTo(url) } }
        )) {
            // Home - always show at top
            Section("Home") {
                NavigationLink(value: FileManager.default.homeDirectoryForCurrentUser) {
                    Label("Home", systemImage: "house")
                }
            }

            // Finder Favorites
            Section("Favorites") {
                if favoritesService.isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .scaleEffect(0.7)
                } else {
                    ForEach(favoritesService.favorites) { favorite in
                        NavigationLink(value: favorite.url) {
                            Label(favorite.name, systemImage: favorite.icon)
                        }
                    }
                }
            }

            Section("Locations") {
                // Volumes
                let volumes = (try? FileManager.default.contentsOfDirectory(
                    at: URL(fileURLWithPath: "/Volumes"),
                    includingPropertiesForKeys: nil
                )) ?? []

                ForEach(volumes, id: \.self) { volume in
                    NavigationLink(value: volume) {
                        Label(volume.lastPathComponent, systemImage: "externaldrive")
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .frame(minWidth: 150)
    }
}

#Preview {
    SidebarView()
        .environmentObject(AppState())
}
