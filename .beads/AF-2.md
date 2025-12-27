---
id: AF-2
title: Right-click compress to zip
type: feature
status: open
priority: 3
created: 2025-12-27T00:00:00Z
---

# Right-click compress to zip

Add a "Compress" option to the context menu that creates a zip file from selected files/folders.

## Requirements
- Context menu option "Compress" when files are selected
- Uses macOS built-in `ditto` command (no external dependencies)
- Creates a .zip file in the same directory
- Named after the first selected item (e.g., "folder.zip" or "Archive.zip" for multiple items)

## Implementation Notes
- Use `ditto -c -k --sequesterRsrc` for creating zip (handles macOS metadata properly)
- Can compress multiple selected items into one archive
