import { contextBridge, ipcRenderer } from 'electron'

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

const electronAPI = {
  // File system operations
  readDirectory: (dirPath: string, showHidden: boolean): Promise<FileInfo[]> =>
    ipcRenderer.invoke('fs:readDirectory', dirPath, showHidden),
  getHomeDir: (): Promise<string> =>
    ipcRenderer.invoke('fs:getHomeDir'),
  getSpecialPaths: (): Promise<SpecialPaths> =>
    ipcRenderer.invoke('fs:getSpecialPaths'),
  openFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('fs:openFile', filePath),
  showInFinder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fs:showInFinder', filePath),
  trashItem: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fs:trashItem', filePath),
  rename: (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('fs:rename', oldPath, newName),
  createFolder: (dirPath: string, name: string): Promise<string> =>
    ipcRenderer.invoke('fs:createFolder', dirPath, name),
  copy: (sources: string[], destDir: string): Promise<void> =>
    ipcRenderer.invoke('fs:copy', sources, destDir),
  move: (sources: string[], destDir: string): Promise<void> =>
    ipcRenderer.invoke('fs:move', sources, destDir),
  exists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:exists', filePath),
  getFileInfo: (filePath: string): Promise<FileInfo> =>
    ipcRenderer.invoke('fs:getFileInfo', filePath),

  // Pinned files
  getPinnedFiles: (dirPath: string): Promise<string[]> =>
    ipcRenderer.invoke('pins:get', dirPath),
  setPinnedFiles: (dirPath: string, pinnedPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('pins:set', dirPath, pinnedPaths),
  addPinnedFile: (dirPath: string, filePath: string): Promise<string[]> =>
    ipcRenderer.invoke('pins:add', dirPath, filePath),
  removePinnedFile: (dirPath: string, filePath: string): Promise<string[]> =>
    ipcRenderer.invoke('pins:remove', dirPath, filePath),

  // Settings
  getShowHiddenFiles: (): Promise<boolean> =>
    ipcRenderer.invoke('settings:getShowHiddenFiles'),
  setShowHiddenFiles: (value: boolean): Promise<void> =>
    ipcRenderer.invoke('settings:setShowHiddenFiles', value),

  // Event listeners
  onNavBack: (callback: () => void) => {
    ipcRenderer.on('nav:back', callback)
    return () => ipcRenderer.removeListener('nav:back', callback)
  },
  onNavForward: (callback: () => void) => {
    ipcRenderer.on('nav:forward', callback)
    return () => ipcRenderer.removeListener('nav:forward', callback)
  },
  onNavUp: (callback: () => void) => {
    ipcRenderer.on('nav:up', callback)
    return () => ipcRenderer.removeListener('nav:up', callback)
  },
  onNavGoto: (callback: (path: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, path: string) => callback(path)
    ipcRenderer.on('nav:goto', handler)
    return () => ipcRenderer.removeListener('nav:goto', handler)
  },
  onNewFolder: (callback: () => void) => {
    ipcRenderer.on('menu:newFolder', callback)
    return () => ipcRenderer.removeListener('menu:newFolder', callback)
  },
  onShowHiddenFilesChange: (callback: (value: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, value: boolean) => callback(value)
    ipcRenderer.on('settings:showHiddenFiles', handler)
    return () => ipcRenderer.removeListener('settings:showHiddenFiles', handler)
  }
}

contextBridge.exposeInMainWorld('electron', electronAPI)

export type ElectronAPI = typeof electronAPI
