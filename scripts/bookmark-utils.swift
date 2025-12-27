#!/usr/bin/env swift

import Foundation

// Bookmark utilities for persistent file/folder tracking
// Usage:
//   bookmark-utils.swift create <path>           - Create bookmark, output base64
//   bookmark-utils.swift resolve <base64>        - Resolve bookmark to current path
//   bookmark-utils.swift batch-create <json>     - Create bookmarks for multiple paths
//   bookmark-utils.swift batch-resolve <json>    - Resolve multiple bookmarks

struct BookmarkResult: Codable {
    let path: String
    let bookmark: String?
    let error: String?
}

struct ResolveResult: Codable {
    let bookmark: String
    let path: String?
    let stale: Bool
    let error: String?
}

func createBookmark(for path: String) -> BookmarkResult {
    let url = URL(fileURLWithPath: path)

    do {
        let bookmarkData = try url.bookmarkData(
            options: [.withSecurityScope, .securityScopeAllowOnlyReadAccess],
            includingResourceValuesForKeys: nil,
            relativeTo: nil
        )
        let base64 = bookmarkData.base64EncodedString()
        return BookmarkResult(path: path, bookmark: base64, error: nil)
    } catch {
        // Try without security scope for non-sandboxed app
        do {
            let bookmarkData = try url.bookmarkData(
                options: [],
                includingResourceValuesForKeys: nil,
                relativeTo: nil
            )
            let base64 = bookmarkData.base64EncodedString()
            return BookmarkResult(path: path, bookmark: base64, error: nil)
        } catch {
            return BookmarkResult(path: path, bookmark: nil, error: error.localizedDescription)
        }
    }
}

func resolveBookmark(_ base64: String) -> ResolveResult {
    guard let bookmarkData = Data(base64Encoded: base64) else {
        return ResolveResult(bookmark: base64, path: nil, stale: false, error: "Invalid base64 data")
    }

    var isStale = false

    do {
        let url = try URL(
            resolvingBookmarkData: bookmarkData,
            options: [.withSecurityScope],
            relativeTo: nil,
            bookmarkDataIsStale: &isStale
        )
        return ResolveResult(bookmark: base64, path: url.path, stale: isStale, error: nil)
    } catch {
        // Try without security scope
        do {
            let url = try URL(
                resolvingBookmarkData: bookmarkData,
                options: [],
                relativeTo: nil,
                bookmarkDataIsStale: &isStale
            )
            return ResolveResult(bookmark: base64, path: url.path, stale: isStale, error: nil)
        } catch {
            return ResolveResult(bookmark: base64, path: nil, stale: false, error: error.localizedDescription)
        }
    }
}

// Main
let args = CommandLine.arguments

guard args.count >= 3 else {
    fputs("Usage: bookmark-utils.swift <create|resolve|batch-create|batch-resolve> <arg>\n", stderr)
    exit(1)
}

let command = args[1]
let arg = args[2]

let encoder = JSONEncoder()
encoder.outputFormatting = .sortedKeys

switch command {
case "create":
    let result = createBookmark(for: arg)
    if let json = try? encoder.encode(result), let str = String(data: json, encoding: .utf8) {
        print(str)
    }

case "resolve":
    let result = resolveBookmark(arg)
    if let json = try? encoder.encode(result), let str = String(data: json, encoding: .utf8) {
        print(str)
    }

case "batch-create":
    // Input is JSON array of paths
    guard let data = arg.data(using: .utf8),
          let paths = try? JSONDecoder().decode([String].self, from: data) else {
        fputs("Invalid JSON array of paths\n", stderr)
        exit(1)
    }
    let results = paths.map { createBookmark(for: $0) }
    if let json = try? encoder.encode(results), let str = String(data: json, encoding: .utf8) {
        print(str)
    }

case "batch-resolve":
    // Input is JSON array of base64 bookmarks
    guard let data = arg.data(using: .utf8),
          let bookmarks = try? JSONDecoder().decode([String].self, from: data) else {
        fputs("Invalid JSON array of bookmarks\n", stderr)
        exit(1)
    }
    let results = bookmarks.map { resolveBookmark($0) }
    if let json = try? encoder.encode(results), let str = String(data: json, encoding: .utf8) {
        print(str)
    }

default:
    fputs("Unknown command: \(command)\n", stderr)
    exit(1)
}
