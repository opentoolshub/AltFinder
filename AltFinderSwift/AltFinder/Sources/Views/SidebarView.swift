import SwiftUI

struct SidebarView: View {
    @EnvironmentObject var appState: AppState

    private let favorites: [(String, URL, String)] = {
        let fm = FileManager.default
        var items: [(String, URL, String)] = []

        // Home
        items.append(("House", fm.homeDirectoryForCurrentUser, "Home"))

        // Desktop
        if let desktop = fm.urls(for: .desktopDirectory, in: .userDomainMask).first {
            items.append(("display", desktop, "Desktop"))
        }

        // Documents
        if let docs = fm.urls(for: .documentDirectory, in: .userDomainMask).first {
            items.append(("doc.text", docs, "Documents"))
        }

        // Downloads
        if let downloads = fm.urls(for: .downloadsDirectory, in: .userDomainMask).first {
            items.append(("arrow.down.circle", downloads, "Downloads"))
        }

        // Applications
        let apps = URL(fileURLWithPath: "/Applications")
        if fm.fileExists(atPath: apps.path) {
            items.append(("square.grid.2x2", apps, "Applications"))
        }

        return items
    }()

    var body: some View {
        List(selection: Binding(
            get: { appState.currentPath },
            set: { if let url = $0 { appState.navigateTo(url) } }
        )) {
            Section("Favorites") {
                ForEach(favorites, id: \.1) { icon, url, name in
                    NavigationLink(value: url) {
                        Label(name, systemImage: icon)
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
