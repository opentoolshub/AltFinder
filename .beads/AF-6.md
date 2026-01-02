---
id: AF-6
title: Code folder not visible in home directory listing
type: bug
status: open
priority: 2
created: 2026-01-01T00:00:00Z
---

# Code folder not visible in home directory listing

User reports that the `code` folder is not showing when viewing the home directory in AltFinder.

## Investigation

- Folder exists at `/Users/jacobcole/code`
- Folder is NOT hidden (doesn't start with `.`)
- Folder appears in normal `ls` output
- Folder has 231 items inside

## Possible Causes

1. Directory cache showing stale data
2. Sort order placing it out of visible range
3. Filter accidentally excluding it
4. Race condition in directory loading

## Steps to Debug

1. Navigate to home directory and scroll to verify folder is missing
2. Try refreshing with Cmd+R
3. Check if other folders are also missing
4. Check console for directory loading errors

## Related Code

- `electron/main.ts:393-416` - readDirectoryFast
- `src/App.tsx:185-303` - loadDirectory function
