import SwiftUI

struct PathBarView: View {
    @EnvironmentObject var appState: AppState

    private var pathComponents: [(String, URL)] {
        var components: [(String, URL)] = []
        var url = appState.currentPath

        while url.path != "/" {
            components.insert((url.lastPathComponent, url), at: 0)
            url = url.deletingLastPathComponent()
        }

        // Add root
        components.insert(("/", URL(fileURLWithPath: "/")), at: 0)

        return components
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 2) {
                ForEach(Array(pathComponents.enumerated()), id: \.1.1) { index, component in
                    if index > 0 {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }

                    Button(action: {
                        appState.navigateTo(component.1)
                    }) {
                        HStack(spacing: 4) {
                            if index == 0 {
                                Image(systemName: "externaldrive")
                                    .font(.system(size: 12))
                            }
                            Text(component.0)
                                .font(.system(size: 12))
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(
                            component.1 == appState.currentPath
                                ? Color.accentColor.opacity(0.2)
                                : Color.clear
                        )
                        .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
        }
        .background(Color(NSColor.controlBackgroundColor).opacity(0.5))
    }
}

#Preview {
    PathBarView()
        .environmentObject(AppState())
}
