#!/usr/bin/env swift

import Foundation

// Path to Finder favorites - try sfl4 first (macOS 26+), then sfl3 (older)
let basePath = NSHomeDirectory() + "/Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.FavoriteItems"
let paths = [basePath + ".sfl4", basePath + ".sfl3"]

var data: Data?
for path in paths {
    if let fileData = FileManager.default.contents(atPath: path) {
        data = fileData
        break
    }
}

guard let data = data else {
    print("[]")
    exit(0)
}

guard let plist = try? NSKeyedUnarchiver.unarchivedObject(ofClasses: [NSDictionary.self, NSArray.self, NSString.self, NSData.self, NSUUID.self, NSNumber.self], from: data) as? NSDictionary else {
    print("[]")
    exit(0)
}

guard let items = plist["items"] as? NSArray else {
    print("[]")
    exit(0)
}

var favorites: [[String: Any]] = []

for item in items {
    guard let itemDict = item as? NSDictionary,
          let bookmarkData = itemDict["Bookmark"] as? Data else {
        continue
    }

    var isStale = false
    if let url = try? URL(resolvingBookmarkData: bookmarkData, options: .withoutUI, relativeTo: nil, bookmarkDataIsStale: &isStale) {
        let name = url.lastPathComponent
        let path = url.path
        favorites.append(["name": name, "path": path])
    }
}

// Output as JSON
if let jsonData = try? JSONSerialization.data(withJSONObject: favorites, options: []),
   let jsonString = String(data: jsonData, encoding: .utf8) {
    print(jsonString)
} else {
    print("[]")
}
