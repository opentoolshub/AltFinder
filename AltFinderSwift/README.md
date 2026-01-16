# AltFinder Swift

A native macOS file browser built with Swift and SwiftUI. This is a rewrite of the Electron-based AltFinder for better performance and native feel.

## Features

- **File Browsing**: List view with sortable columns (Name, Date Modified, Size, Kind)
- **Navigation**: Breadcrumb path bar, back/forward history, sidebar with favorites
- **Pinned Files**: Pin important files/folders to the top using `.altfinder.json` manifests
- **File Operations**: Copy, cut, paste, rename, delete to trash, create folder
- **Context Menu**: Right-click quick actions
- **Search**: Filter files in current directory
- **Hidden Files**: Toggle visibility with Cmd+Shift+.
- **Dark Mode**: Automatic system appearance support
- **Persistence**: Remembers window state, last path, and preferences

## Requirements

- macOS 14.0+
- Xcode 15.0+

## Building

### From Command Line

```bash
cd AltFinderSwift
xcodebuild -project AltFinder.xcodeproj -scheme AltFinder -configuration Release build
```

The built app will be in `~/Library/Developer/Xcode/DerivedData/AltFinder-*/Build/Products/Release/AltFinder.app`

### From Xcode

1. Open `AltFinder.xcodeproj` in Xcode
2. Select the AltFinder scheme
3. Press Cmd+R to build and run

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+C | Copy |
| Cmd+X | Cut |
| Cmd+V | Paste |
| Cmd+Shift+N | New Folder |
| Cmd+[ | Back |
| Cmd+] | Forward |
| Cmd+Up | Go to parent folder |
| Cmd+Shift+. | Toggle hidden files |
| Delete | Move to Trash |
| Return | Rename selected item |
| Cmd+A | Select all |

## Project Structure

```
AltFinderSwift/
├── AltFinder.xcodeproj/
├── AltFinder/
│   ├── Sources/
│   │   ├── AltFinderApp.swift      # App entry point
│   │   ├── Models/
│   │   │   ├── AppState.swift      # Global app state
│   │   │   ├── FileItem.swift      # File item model
│   │   │   ├── Manifest.swift      # .altfinder.json handling
│   │   │   └── Clipboard.swift     # Copy/cut/paste manager
│   │   ├── ViewModels/
│   │   │   └── FileSystemViewModel.swift
│   │   └── Views/
│   │       ├── ContentView.swift   # Main view
│   │       ├── SidebarView.swift   # Favorites sidebar
│   │       ├── ToolbarView.swift   # Top toolbar
│   │       ├── PathBarView.swift   # Breadcrumb navigation
│   │       ├── FileListView.swift  # File list with headers
│   │       ├── FileRowView.swift   # Individual file row
│   │       └── SettingsView.swift  # Preferences window
│   ├── Resources/
│   │   └── Assets.xcassets/
│   └── AltFinder.entitlements
└── README.md
```

## Manifest Format

AltFinder uses `.altfinder.json` files to track pinned items in each directory:

```json
{
  "version": 2,
  "pinned": ["important-folder", "readme.md"]
}
```

This format is compatible with the Electron version of AltFinder.
