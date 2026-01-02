---
id: AF-7
title: Claude Code integration - search and terminal sidebar
type: feature
status: open
priority: 2
created: 2026-01-01T00:00:00Z
---

# Claude Code integration - search and terminal sidebar

Add Claude Code-style search functionality and/or the ability to open Claude Code in the current folder. Could also include a Claude Code terminal sidebar.

## Proposed Features

### Option A: Claude Code Search
- Add semantic/AI-powered search similar to Claude Code's search
- Search across file contents with intelligent ranking
- Could use local embedding model or Claude API

### Option B: Open in Claude Code
- Add context menu option "Open in Claude Code"
- Add toolbar button to launch Claude Code in current directory
- Command: `claude --cwd <path>` or similar

### Option C: Terminal Sidebar
- Embed a terminal panel in AltFinder
- Could integrate Claude Code directly
- Show terminal output alongside file browser

## Implementation Notes

For "Open in Claude Code":
```typescript
// In context menu handler
exec(`claude --cwd "${dirPath}"`)
// Or open in Terminal with claude command
exec(`open -a Terminal "${dirPath}" && claude`)
```

## Priority

Start with Option B (Open in Claude Code) as quickest win, then consider sidebar.

## Related

- Context menu: `src/components/ContextMenu.tsx`
- Terminal opening: `electron/main.ts:1140-1144`
