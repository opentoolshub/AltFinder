---
id: AF-4
title: Shell command ignores path argument
type: bug
status: done
priority: 1
created: 2025-12-27T00:00:00Z
---

# Shell command ignores path argument

Running `altfinder ~/code` opens AltFinder in the home directory instead of ~/code.

## Steps to Reproduce
1. Run `altfinder ~/code` from Terminal
2. AltFinder opens but shows home directory, not ~/code

## Expected Behavior
AltFinder should open and navigate to the specified path.

## Technical Notes
The shell command at `/usr/local/bin/altfinder` uses `open -a` which may not be passing arguments correctly to the Electron app. Need to investigate:
- How arguments are passed via `open -a`
- The `open-file` event handler in main.ts
- ALTFINDER_PATH env var approach
