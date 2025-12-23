export interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedTime: number
  createdTime: number
  kind: string
  extension: string
}

export interface SpecialPaths {
  home: string
  desktop: string
  documents: string
  downloads: string
  music: string
  pictures: string
  videos: string
  applications: string
}

export type SortField = 'name' | 'modifiedTime' | 'createdTime' | 'size' | 'kind'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}

export interface ClipboardState {
  files: string[]
  operation: 'copy' | 'cut' | null
}

declare global {
  interface Window {
    electron: {
      readDirectory: (dirPath: string, showHidden: boolean) => Promise<FileInfo[]>
      readDirectoryWithMeta: (dirPath: string, showHidden: boolean, limit?: number) => Promise<{ files: FileInfo[]; total: number; hasMore: boolean }>
      getHomeDir: () => Promise<string>
      getSpecialPaths: () => Promise<SpecialPaths>
      openFile: (filePath: string) => Promise<string>
      showInFinder: (filePath: string) => Promise<void>
      trashItem: (filePath: string) => Promise<void>
      rename: (oldPath: string, newName: string) => Promise<string>
      createFolder: (dirPath: string, name: string) => Promise<string>
      copy: (sources: string[], destDir: string) => Promise<void>
      move: (sources: string[], destDir: string) => Promise<void>
      exists: (filePath: string) => Promise<boolean>
      getFileInfo: (filePath: string) => Promise<FileInfo>
      getPinnedFiles: (dirPath: string) => Promise<string[]>
      setPinnedFiles: (dirPath: string, pinnedPaths: string[]) => Promise<void>
      addPinnedFile: (dirPath: string, filePath: string) => Promise<string[]>
      removePinnedFile: (dirPath: string, filePath: string) => Promise<string[]>
      getAllPinnedFiles: () => Promise<{ file: FileInfo; sourceDir: string }[]>
      getShowHiddenFiles: () => Promise<boolean>
      setShowHiddenFiles: (value: boolean) => Promise<void>
      getSortOrder: (dirPath: string) => Promise<SortConfig>
      setSortOrder: (dirPath: string, config: SortConfig) => Promise<void>
      getFinderFavorites: () => Promise<{ name: string; path: string }[]>
      onNavBack: (callback: () => void) => () => void
      onNavForward: (callback: () => void) => () => void
      onNavUp: (callback: () => void) => () => void
      onNavGoto: (callback: (path: string) => void) => () => void
      onNewFolder: (callback: () => void) => () => void
      onShowHiddenFilesChange: (callback: (value: boolean) => void) => () => void
      onFavoritesChanged: (callback: () => void) => () => void
      openTerminal: (path: string) => Promise<void>
      writeTextToClipboard: (text: string) => Promise<void>
    }
  }
}
