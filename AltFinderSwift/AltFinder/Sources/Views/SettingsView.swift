import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("defaultSortColumn") private var defaultSortColumn = "name"
    @AppStorage("defaultSortOrder") private var defaultSortOrder = "ascending"

    var body: some View {
        TabView {
            GeneralSettingsView()
                .environmentObject(appState)
                .tabItem {
                    Label("General", systemImage: "gear")
                }
        }
        .frame(width: 400, height: 200)
    }
}

struct GeneralSettingsView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Form {
            Section {
                Toggle("Show Hidden Files by Default", isOn: $appState.showHiddenFiles)

                Picker("Default Sort", selection: .constant("name")) {
                    Text("Name").tag("name")
                    Text("Date Modified").tag("dateModified")
                    Text("Size").tag("size")
                    Text("Kind").tag("kind")
                }
            }

            Section {
                LabeledContent("Version") {
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
}
