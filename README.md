# AltFinder

A Finder alternative for macOS built with Electron, React, and TypeScript.

## Features

- **File Browser** - List view with sortable columns (Name, Date Modified, Size, Kind)
- **Path Bar** - Clickable breadcrumb navigation
- **Pinned Files** - Pin files/folders to the top of each directory (stored in `.altfinder.json` manifest files)
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
| Search | Cmd+F |
| Back | Cmd+[ |
| Forward | Cmd+] |
| Go Up | Cmd+Up |
| New Folder | Cmd+Shift+N |
| New Window | Cmd+N |
| Show/Hide Hidden Files | Cmd+Shift+. |

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

## Pinned Files & Manifest

Pinned files are stored in `.altfinder.json` manifest files within each directory. This approach makes pins:

- **Discoverable** - Visible to Finder, AI agents, and other tools
- **Portable** - Pins travel with the folder when copied or moved
- **Version-controllable** - Can be tracked in git if desired

**Manifest format:**
```json
{
  "version": 1,
  "pinned": ["important-file.txt", "project-notes.md"]
}
```

The manifest stores filenames (not full paths), so it remains valid if the parent directory is moved.

## Tech Stack

- Electron
- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- electron-store (for persisting settings)
