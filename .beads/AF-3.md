---
id: AF-3
title: Recently pinned view with sort by pin date
type: feature
status: open
priority: 3
created: 2025-12-27T00:00:00Z
---

# Recently pinned view with sort by pin date

Add ability to see recently pinned items and sort pinned files by when they were pinned.

## Requirements
- Track timestamp when each file is pinned
- Add "Sort by Pin Date" option in All Pinned view
- Show most recently pinned items first (or configurable order)
- Display relative time (e.g., "pinned 2 hours ago") in UI

## Implementation Notes
- Add `pinnedAt` timestamp to PinnedItem in manifest
- Store as ISO date string for readability
- Update manifest version to handle new field
