import SwiftUI

@main
struct AltFinderApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
        .windowStyle(.automatic)
        .windowToolbarStyle(.unified(showsTitle: true))
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("New Folder") {
                    NotificationCenter.default.post(name: .createNewFolder, object: nil)
                }
                .keyboardShortcut("N", modifiers: [.command, .shift])
            }

            CommandGroup(after: .pasteboard) {
                Divider()
                Button("Select All") {
                    NotificationCenter.default.post(name: .selectAll, object: nil)
                }
                .keyboardShortcut("A", modifiers: .command)
            }

            CommandGroup(replacing: .sidebar) {
                Button("Toggle Sidebar") {
                    NotificationCenter.default.post(name: .toggleSidebar, object: nil)
                }
                .keyboardShortcut("S", modifiers: [.command, .control])
            }

            CommandMenu("View") {
                Button("Show Hidden Files") {
                    appState.showHiddenFiles.toggle()
                }
                .keyboardShortcut(".", modifiers: [.command, .shift])

                Divider()

                Button("Back") {
                    NotificationCenter.default.post(name: .navigateBack, object: nil)
                }
                .keyboardShortcut("[", modifiers: .command)

                Button("Forward") {
                    NotificationCenter.default.post(name: .navigateForward, object: nil)
                }
                .keyboardShortcut("]", modifiers: .command)

                Button("Enclosing Folder") {
                    NotificationCenter.default.post(name: .navigateUp, object: nil)
                }
                .keyboardShortcut(.upArrow, modifiers: .command)
            }

            CommandMenu("Go") {
                Button("Home") {
                    appState.navigateTo(FileManager.default.homeDirectoryForCurrentUser)
                }
                .keyboardShortcut("H", modifiers: [.command, .shift])

                Button("Desktop") {
                    if let desktop = FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first {
                        appState.navigateTo(desktop)
                    }
                }
                .keyboardShortcut("D", modifiers: [.command, .shift])

                Button("Documents") {
                    if let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
                        appState.navigateTo(docs)
                    }
                }
                .keyboardShortcut("O", modifiers: [.command, .shift])

                Button("Downloads") {
                    if let downloads = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first {
                        appState.navigateTo(downloads)
                    }
                }
                .keyboardShortcut("L", modifiers: [.command, .shift])
            }
        }

        Settings {
            SettingsView()
                .environmentObject(appState)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Set app name in dock
        NSApplication.shared.mainMenu?.title = "AltFinder"
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let createNewFolder = Notification.Name("createNewFolder")
    static let selectAll = Notification.Name("selectAll")
    static let toggleSidebar = Notification.Name("toggleSidebar")
    static let navigateBack = Notification.Name("navigateBack")
    static let navigateForward = Notification.Name("navigateForward")
    static let navigateUp = Notification.Name("navigateUp")
}
