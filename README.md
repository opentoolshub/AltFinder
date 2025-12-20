# AltFinder

A Finder alternative for macOS built with Electron, React, and TypeScript.

## Features

- **File Browser** - List view with sortable columns (Name, Date Modified, Size, Kind)
- **Path Bar** - Clickable breadcrumb navigation
- **Pinned Files** - Pin files/folders to the top of each directory (persisted)
- **Navigation** - Back/forward history, go to parent folder
- **File Operations** - Copy, cut, paste, rename, delete to trash, create folder
- **Context Menu** - Right-click for quick actions
- **Search** - Filter files in current directory
- **Dark Mode** - Automatic dark/light mode support

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Copy | Cmd+C |
| Cut | Cmd+X |
| Paste | Cmd+V |
| Delete | Cmd+Backspace |
| Rename | Enter (with single selection) |
| Select All | Cmd+A |
| Back | Cmd+[ |
| Forward | Cmd+] |
| Go Up | Cmd+Up |
| New Folder | Cmd+Shift+N |

## Running

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Package as app
npm run package
```

## Tech Stack

- Electron
- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- electron-store (for persisting settings)
