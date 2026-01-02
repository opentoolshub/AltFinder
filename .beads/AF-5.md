---
id: AF-5
title: Favorites not showing in sidebar
type: bug
status: open
priority: 1
created: 2026-01-01T00:00:00Z
---

# Favorites not showing in sidebar

User reports favorites are not visible in the sidebar, with no error shown in console.

## Investigation

- Swift script `read-finder-favorites.swift` works correctly and returns favorites
- Favorites include "code" folder and other expected items
- Filtering logic in `main.ts:1109-1111` and `Sidebar.tsx:208-211` appears correct

## Possible Causes

1. Race condition in favorites loading on startup
2. Cache not being invalidated properly
3. App state issue requiring reload
4. `favoritesLoading` staying true or `favorites` array not being populated

## Steps to Debug

1. Check renderer console for "Loading Finder favorites..." and "Received favorites:" logs
2. Verify `getFinderFavorites` IPC handler is being called
3. Check if `favoritesLoading` state is stuck as `true`

## Related Code

- `src/App.tsx:68-83` - loadFavorites function
- `electron/main.ts:1074-1118` - getFinderFavorites implementation
- `src/components/Sidebar.tsx` - favorites display logic
