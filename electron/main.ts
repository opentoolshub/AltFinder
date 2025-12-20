import { app, BrowserWindow, ipcMain, shell, Menu, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, statSync } from 'fs'
import Store from 'electron-store'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set app name
app.name = 'AltFinder'

interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedTime: number
  createdTime: number
  kind: string
  extension: string
}

interface StoreSchema {
  pinnedFiles: Record<string, string[]>
  windowBounds: { width: number; height: number; x?: number; y?: number }
  showHiddenFiles: boolean
}

const store = new Store<StoreSchema>({
  defaults: {
    pinnedFiles: {},
    windowBounds: { width: 1000, height: 700 },
    showHiddenFiles: false
  }
})

let mainWindow: BrowserWindow | null = null

function getFileKind(name: string, isDirectory: boolean): string {
  if (isDirectory) return 'Folder'

  const ext = path.extname(name).toLowerCase()
  const kinds: Record<string, string> = {
    '.txt': 'Text Document',
    '.md': 'Markdown Document',
    '.pdf': 'PDF Document',
    '.doc': 'Word Document',
    '.docx': 'Word Document',
    '.xls': 'Excel Spreadsheet',
    '.xlsx': 'Excel Spreadsheet',
    '.ppt': 'PowerPoint Presentation',
    '.pptx': 'PowerPoint Presentation',
    '.jpg': 'JPEG Image',
    '.jpeg': 'JPEG Image',
    '.png': 'PNG Image',
    '.gif': 'GIF Image',
    '.svg': 'SVG Image',
    '.webp': 'WebP Image',
    '.mp3': 'MP3 Audio',
    '.wav': 'WAV Audio',
    '.m4a': 'M4A Audio',
    '.mp4': 'MP4 Video',
    '.mov': 'QuickTime Movie',
    '.avi': 'AVI Video',
    '.mkv': 'MKV Video',
    '.zip': 'ZIP Archive',
    '.rar': 'RAR Archive',
    '.7z': '7-Zip Archive',
    '.tar': 'TAR Archive',
    '.gz': 'GZip Archive',
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.jsx': 'JSX',
    '.tsx': 'TSX',
    '.json': 'JSON',
    '.html': 'HTML Document',
    '.css': 'CSS Stylesheet',
    '.py': 'Python Script',
    '.rb': 'Ruby Script',
    '.go': 'Go Source',
    '.rs': 'Rust Source',
    '.swift': 'Swift Source',
    '.java': 'Java Source',
    '.c': 'C Source',
    '.cpp': 'C++ Source',
    '.h': 'Header File',
    '.sh': 'Shell Script',
    '.dmg': 'Disk Image',
    '.app': 'Application',
    '.pkg': 'Installer Package',
  }

  return kinds[ext] || (ext ? `${ext.slice(1).toUpperCase()} File` : 'Document')
}

async function readDirectory(dirPath: string, showHidden: boolean): Promise<FileInfo[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files: FileInfo[] = []

  for (const entry of entries) {
    if (!showHidden && entry.name.startsWith('.')) continue

    const fullPath = path.join(dirPath, entry.name)
    try {
      const stats = await fs.stat(fullPath)
      files.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stats.size,
        modifiedTime: stats.mtimeMs,
        createdTime: stats.birthtimeMs,
        kind: getFileKind(entry.name, entry.isDirectory()),
        extension: path.extname(entry.name).toLowerCase()
      })
    } catch {
      // Skip files we can't read
    }
  }

  return files
}

function createWindow() {
  const bounds = store.get('windowBounds')

  // Create app icon
  const iconPath = path.join(__dirname, '../public/icon.png')
  let icon = undefined
  if (existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
  }

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 600,
    minHeight: 400,
    title: 'AltFinder',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'sidebar',
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Save window bounds on resize/move
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      const [x, y] = mainWindow.getPosition()
      store.set('windowBounds', { width, height, x, y })
    }
  })

  mainWindow.on('move', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      const [x, y] = mainWindow.getPosition()
      store.set('windowBounds', { width, height, x, y })
    }
  })

  // Log renderer console to terminal
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const levelName = levels[level] || 'LOG'
    const source = sourceId ? sourceId.split('/').pop() : 'unknown'
    console.log(`[Renderer ${levelName}] ${source}:${line} - ${message}`)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// Build application menu
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Folder',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow?.webContents.send('menu:newFolder')
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Show Hidden Files',
          type: 'checkbox',
          checked: store.get('showHiddenFiles'),
          click: (menuItem) => {
            store.set('showHiddenFiles', menuItem.checked)
            mainWindow?.webContents.send('settings:showHiddenFiles', menuItem.checked)
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Go',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => mainWindow?.webContents.send('nav:back')
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => mainWindow?.webContents.send('nav:forward')
        },
        {
          label: 'Enclosing Folder',
          accelerator: 'CmdOrCtrl+Up',
          click: () => mainWindow?.webContents.send('nav:up')
        },
        { type: 'separator' },
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow?.webContents.send('nav:goto', app.getPath('home'))
        },
        {
          label: 'Desktop',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow?.webContents.send('nav:goto', app.getPath('desktop'))
        },
        {
          label: 'Documents',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow?.webContents.send('nav:goto', app.getPath('documents'))
        },
        {
          label: 'Downloads',
          accelerator: 'CmdOrCtrl+Option+L',
          click: () => mainWindow?.webContents.send('nav:goto', app.getPath('downloads'))
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers

ipcMain.handle('fs:readDirectory', async (_, dirPath: string, showHidden: boolean) => {
  return readDirectory(dirPath, showHidden)
})

ipcMain.handle('fs:getHomeDir', () => app.getPath('home'))

ipcMain.handle('fs:getSpecialPaths', () => ({
  home: app.getPath('home'),
  desktop: app.getPath('desktop'),
  documents: app.getPath('documents'),
  downloads: app.getPath('downloads'),
  music: app.getPath('music'),
  pictures: app.getPath('pictures'),
  videos: app.getPath('videos'),
  applications: '/Applications'
}))

ipcMain.handle('fs:openFile', async (_, filePath: string) => {
  return shell.openPath(filePath)
})

ipcMain.handle('fs:showInFinder', async (_, filePath: string) => {
  shell.showItemInFolder(filePath)
})

ipcMain.handle('fs:trashItem', async (_, filePath: string) => {
  return shell.trashItem(filePath)
})

ipcMain.handle('fs:rename', async (_, oldPath: string, newName: string) => {
  const dir = path.dirname(oldPath)
  const newPath = path.join(dir, newName)
  await fs.rename(oldPath, newPath)
  return newPath
})

ipcMain.handle('fs:createFolder', async (_, dirPath: string, name: string) => {
  const newPath = path.join(dirPath, name)
  await fs.mkdir(newPath)
  return newPath
})

ipcMain.handle('fs:copy', async (_, sources: string[], destDir: string) => {
  for (const source of sources) {
    const name = path.basename(source)
    const dest = path.join(destDir, name)
    const stat = statSync(source)

    if (stat.isDirectory()) {
      await fs.cp(source, dest, { recursive: true })
    } else {
      await fs.copyFile(source, dest)
    }
  }
})

ipcMain.handle('fs:move', async (_, sources: string[], destDir: string) => {
  for (const source of sources) {
    const name = path.basename(source)
    const dest = path.join(destDir, name)
    await fs.rename(source, dest)
  }
})

ipcMain.handle('fs:exists', async (_, filePath: string) => {
  return existsSync(filePath)
})

ipcMain.handle('fs:getFileInfo', async (_, filePath: string) => {
  const stats = await fs.stat(filePath)
  const name = path.basename(filePath)
  return {
    name,
    path: filePath,
    isDirectory: stats.isDirectory(),
    size: stats.size,
    modifiedTime: stats.mtimeMs,
    createdTime: stats.birthtimeMs,
    kind: getFileKind(name, stats.isDirectory()),
    extension: path.extname(name).toLowerCase()
  }
})

// Pinned files
ipcMain.handle('pins:get', (_, dirPath: string) => {
  const pins = store.get('pinnedFiles')
  return pins[dirPath] || []
})

ipcMain.handle('pins:set', (_, dirPath: string, pinnedPaths: string[]) => {
  const pins = store.get('pinnedFiles')
  pins[dirPath] = pinnedPaths
  store.set('pinnedFiles', pins)
})

ipcMain.handle('pins:add', (_, dirPath: string, filePath: string) => {
  const pins = store.get('pinnedFiles')
  if (!pins[dirPath]) pins[dirPath] = []
  if (!pins[dirPath].includes(filePath)) {
    pins[dirPath].push(filePath)
    store.set('pinnedFiles', pins)
  }
  return pins[dirPath]
})

ipcMain.handle('pins:remove', (_, dirPath: string, filePath: string) => {
  const pins = store.get('pinnedFiles')
  if (pins[dirPath]) {
    pins[dirPath] = pins[dirPath].filter((p: string) => p !== filePath)
    store.set('pinnedFiles', pins)
  }
  return pins[dirPath] || []
})

// Settings
ipcMain.handle('settings:getShowHiddenFiles', () => store.get('showHiddenFiles'))
ipcMain.handle('settings:setShowHiddenFiles', (_, value: boolean) => {
  store.set('showHiddenFiles', value)
})
