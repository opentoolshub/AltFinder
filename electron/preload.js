const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  // File system operations
  readDirectory: (dirPath, showHidden) =>
    ipcRenderer.invoke('fs:readDirectory', dirPath, showHidden),
  getHomeDir: () =>
    ipcRenderer.invoke('fs:getHomeDir'),
  getSpecialPaths: () =>
    ipcRenderer.invoke('fs:getSpecialPaths'),
  openFile: (filePath) =>
    ipcRenderer.invoke('fs:openFile', filePath),
  showInFinder: (filePath) =>
    ipcRenderer.invoke('fs:showInFinder', filePath),
  trashItem: (filePath) =>
    ipcRenderer.invoke('fs:trashItem', filePath),
  rename: (oldPath, newName) =>
    ipcRenderer.invoke('fs:rename', oldPath, newName),
  createFolder: (dirPath, name) =>
    ipcRenderer.invoke('fs:createFolder', dirPath, name),
  copy: (sources, destDir) =>
    ipcRenderer.invoke('fs:copy', sources, destDir),
  move: (sources, destDir) =>
    ipcRenderer.invoke('fs:move', sources, destDir),
  exists: (filePath) =>
    ipcRenderer.invoke('fs:exists', filePath),
  getFileInfo: (filePath) =>
    ipcRenderer.invoke('fs:getFileInfo', filePath),

  // Pinned files
  getPinnedFiles: (dirPath) =>
    ipcRenderer.invoke('pins:get', dirPath),
  setPinnedFiles: (dirPath, pinnedPaths) =>
    ipcRenderer.invoke('pins:set', dirPath, pinnedPaths),
  addPinnedFile: (dirPath, filePath) =>
    ipcRenderer.invoke('pins:add', dirPath, filePath),
  removePinnedFile: (dirPath, filePath) =>
    ipcRenderer.invoke('pins:remove', dirPath, filePath),

  // Settings
  getShowHiddenFiles: () =>
    ipcRenderer.invoke('settings:getShowHiddenFiles'),
  setShowHiddenFiles: (value) =>
    ipcRenderer.invoke('settings:setShowHiddenFiles', value),

  // Event listeners
  onNavBack: (callback) => {
    ipcRenderer.on('nav:back', callback)
    return () => ipcRenderer.removeListener('nav:back', callback)
  },
  onNavForward: (callback) => {
    ipcRenderer.on('nav:forward', callback)
    return () => ipcRenderer.removeListener('nav:forward', callback)
  },
  onNavUp: (callback) => {
    ipcRenderer.on('nav:up', callback)
    return () => ipcRenderer.removeListener('nav:up', callback)
  },
  onNavGoto: (callback) => {
    const handler = (_, path) => callback(path)
    ipcRenderer.on('nav:goto', handler)
    return () => ipcRenderer.removeListener('nav:goto', handler)
  },
  onNewFolder: (callback) => {
    ipcRenderer.on('menu:newFolder', callback)
    return () => ipcRenderer.removeListener('menu:newFolder', callback)
  },
  onShowHiddenFilesChange: (callback) => {
    const handler = (_, value) => callback(value)
    ipcRenderer.on('settings:showHiddenFiles', handler)
    return () => ipcRenderer.removeListener('settings:showHiddenFiles', handler)
  }
}

contextBridge.exposeInMainWorld('electron', electronAPI)
