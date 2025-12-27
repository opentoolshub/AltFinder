import { app, BrowserWindow, ipcMain, shell, Menu, nativeImage, clipboard, dialog } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, statSync, watch } from 'fs'
import { exec, spawn } from 'child_process'
import Store from 'electron-store'
import { fileURLToPath } from 'url'
import { homedir } from 'os'
import { promisify } from 'util'

const execAsync = promisify(exec)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set app name early (before app is ready)
app.setName('AltFinder')
if (process.platform === 'darwin') {
  // This helps with the dock label in some cases
  process.title = 'AltFinder'
}

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
  pinnedFiles: Record<string, string[]>  // Legacy - kept for migration
  windowBounds: { width: number; height: number; x?: number; y?: number }
  showHiddenFiles: boolean
  folderSort: Record<string, { field: string; direction: string }>
  migratedToManifest: boolean  // Track if we've migrated legacy pins
  pinnedDirectories: string[]  // Index of directories that have manifests
}

// Manifest file structure for .altfinder.json
interface AltFinderManifest {
  version: 1
  pinned: string[]  // Array of filenames (not full paths, just names)
}

const store = new Store<StoreSchema>({
  defaults: {
    pinnedFiles: {},
    windowBounds: { width: 1000, height: 700 },
    showHiddenFiles: false,
    folderSort: {},
    migratedToManifest: false,
    pinnedDirectories: []
  }
})

const MANIFEST_FILENAME = '.altfinder.json'

// Read manifest from a directory
async function readManifest(dirPath: string): Promise<AltFinderManifest | null> {
  const manifestPath = path.join(dirPath, MANIFEST_FILENAME)
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(content) as AltFinderManifest
  } catch {
    return null
  }
}

// Write manifest to a directory
async function writeManifest(dirPath: string, manifest: AltFinderManifest): Promise<boolean> {
  const manifestPath = path.join(dirPath, MANIFEST_FILENAME)
  try {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error(`Failed to write manifest to ${dirPath}:`, error)
    return false
  }
}

// Get pinned file paths for a directory (reads from manifest)
async function getPinnedFiles(dirPath: string): Promise<string[]> {
  const manifest = await readManifest(dirPath)
  if (!manifest || !manifest.pinned) return []
  // Convert filenames to full paths
  return manifest.pinned.map(name => path.join(dirPath, name))
}

// Set pinned files for a directory (writes to manifest)
async function setPinnedFiles(dirPath: string, filePaths: string[]): Promise<boolean> {
  // Convert full paths to just filenames
  const filenames = filePaths.map(p => path.basename(p))
  const manifest: AltFinderManifest = {
    version: 1,
    pinned: filenames
  }
  const success = await writeManifest(dirPath, manifest)

  // Update directory index
  if (success) {
    const dirs = store.get('pinnedDirectories')
    if (filenames.length > 0) {
      if (!dirs.includes(dirPath)) {
        dirs.push(dirPath)
        store.set('pinnedDirectories', dirs)
      }
    } else {
      // Remove from index if no pins
      store.set('pinnedDirectories', dirs.filter(d => d !== dirPath))
    }
  }

  return success
}

// Migrate legacy pins from electron-store to manifest files
async function migrateLegacyPins(): Promise<void> {
  if (store.get('migratedToManifest')) return

  const legacyPins = store.get('pinnedFiles')
  const migratedDirs: string[] = []
  let migrated = 0
  let failed = 0

  for (const [dirPath, filePaths] of Object.entries(legacyPins)) {
    if (filePaths.length === 0) continue

    // Check if directory still exists
    if (!existsSync(dirPath)) continue

    // Only migrate if no manifest exists yet (don't overwrite)
    const existingManifest = await readManifest(dirPath)
    if (existingManifest) {
      // Still track existing manifests in index
      migratedDirs.push(dirPath)
      continue
    }

    // Write manifest directly (not via setPinnedFiles to avoid index updates during migration)
    const filenames = filePaths.map((p: string) => path.basename(p))
    const manifest: AltFinderManifest = { version: 1, pinned: filenames }
    const success = await writeManifest(dirPath, manifest)

    if (success) {
      migrated++
      migratedDirs.push(dirPath)
      console.log(`Migrated pins for: ${dirPath}`)
    } else {
      failed++
      console.error(`Failed to migrate pins for: ${dirPath}`)
    }
  }

  // Update directory index with all migrated directories
  if (migratedDirs.length > 0) {
    const existingDirs = store.get('pinnedDirectories')
    const allDirs = [...new Set([...existingDirs, ...migratedDirs])]
    store.set('pinnedDirectories', allDirs)
  }

  if (migrated > 0 || failed === 0) {
    store.set('migratedToManifest', true)
    console.log(`Pin migration complete: ${migrated} directories migrated`)
  }
}

let mainWindow: BrowserWindow | null = null  // Track most recently focused window for menu actions
let fileToOpen: string | null = process.env.ALTFINDER_PATH || null

// Get the focused window or fall back to any window
function getFocusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() || mainWindow || BrowserWindow.getAllWindows()[0] || null
}

// Handle opening directory via "Open With" or command line on macOS
app.on('open-file', (event, path) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('nav:goto', path)
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  } else {
    fileToOpen = path
  }
})

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

// Fast directory read - no stat calls, just basic info from readdir
async function readDirectoryFast(dirPath: string, showHidden: boolean, limit?: number): Promise<{ files: FileInfo[]; total: number; hasMore: boolean }> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  const filteredEntries = showHidden
    ? entries
    : entries.filter(e => !e.name.startsWith('.'))

  const total = filteredEntries.length
  const entriesToProcess = limit ? filteredEntries.slice(0, limit) : filteredEntries
  const hasMore = limit ? filteredEntries.length > limit : false

  const files = entriesToProcess.map((entry) => ({
    name: entry.name,
    path: path.join(dirPath, entry.name),
    isDirectory: entry.isDirectory(),
    size: 0, // Will be filled in by metadata load
    modifiedTime: 0,
    createdTime: 0,
    kind: getFileKind(entry.name, entry.isDirectory()),
    extension: path.extname(entry.name).toLowerCase()
  }))

  return { files, total, hasMore }
}

// Get metadata for a batch of files
async function getFilesMetadata(filePaths: string[]): Promise<Record<string, { size: number; modifiedTime: number; createdTime: number }>> {
  const results: Record<string, { size: number; modifiedTime: number; createdTime: number }> = {}

  const statResults = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath)
      return {
        path: filePath,
        size: stats.size,
        modifiedTime: stats.mtimeMs,
        createdTime: stats.birthtimeMs
      }
    })
  )

  for (const result of statResults) {
    if (result.status === 'fulfilled') {
      results[result.value.path] = {
        size: result.value.size,
        modifiedTime: result.value.modifiedTime,
        createdTime: result.value.createdTime
      }
    }
  }

  return results
}

async function readDirectory(dirPath: string, showHidden: boolean, limit?: number): Promise<FileInfo[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files: FileInfo[] = []

  // Filter entries first (faster than checking in loop)
  const filteredEntries = showHidden
    ? entries
    : entries.filter(e => !e.name.startsWith('.'))

  // Process entries up to limit (or all if no limit)
  const entriesToProcess = limit ? filteredEntries.slice(0, limit) : filteredEntries

  // Process in parallel for speed
  const results = await Promise.allSettled(
    entriesToProcess.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name)
      const stats = await fs.stat(fullPath)
      return {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stats.size,
        modifiedTime: stats.mtimeMs,
        createdTime: stats.birthtimeMs,
        kind: getFileKind(entry.name, entry.isDirectory()),
        extension: path.extname(entry.name).toLowerCase()
      }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      files.push(result.value)
    }
  }

  return files
}

// Read directory with pagination info
async function readDirectoryWithMeta(dirPath: string, showHidden: boolean, limit?: number): Promise<{ files: FileInfo[]; total: number; hasMore: boolean }> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  // Filter entries first
  const filteredEntries = showHidden
    ? entries
    : entries.filter(e => !e.name.startsWith('.'))

  const total = filteredEntries.length
  const entriesToProcess = limit ? filteredEntries.slice(0, limit) : filteredEntries
  const hasMore = limit ? filteredEntries.length > limit : false

  // Process in parallel for speed
  const results = await Promise.allSettled(
    entriesToProcess.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name)
      const stats = await fs.stat(fullPath)
      return {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stats.size,
        modifiedTime: stats.mtimeMs,
        createdTime: stats.birthtimeMs,
        kind: getFileKind(entry.name, entry.isDirectory()),
        extension: path.extname(entry.name).toLowerCase()
      }
    })
  )

  const files: FileInfo[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      files.push(result.value)
    }
  }

  return { files, total, hasMore }
}

function createWindow(initialPath?: string): BrowserWindow {
  const bounds = store.get('windowBounds')

  // Create app icon
  const iconPath = path.join(__dirname, '../public/icon.png')
  let icon = undefined
  if (existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
    if (process.platform === 'darwin') {
      app.dock.setIcon(icon)
    }
  }

  // Offset new windows slightly from existing ones
  const existingWindows = BrowserWindow.getAllWindows()
  const offset = existingWindows.length * 30

  const newWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: (bounds.x ?? 100) + offset,
    y: (bounds.y ?? 100) + offset,
    minWidth: 600,
    minHeight: 400,
    title: 'AltFinder',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'sidebar',
    icon: icon,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Track as main window for menu actions
  mainWindow = newWindow

  newWindow.once('ready-to-show', () => {
    newWindow.show()
  })

  // Update mainWindow reference when this window is focused
  newWindow.on('focus', () => {
    mainWindow = newWindow
  })

  // Save window bounds on resize/move (only from this window)
  newWindow.on('resize', () => {
    const [width, height] = newWindow.getSize()
    const [x, y] = newWindow.getPosition()
    store.set('windowBounds', { width, height, x, y })
  })

  newWindow.on('move', () => {
    const [width, height] = newWindow.getSize()
    const [x, y] = newWindow.getPosition()
    store.set('windowBounds', { width, height, x, y })
  })

  // Log renderer console to terminal
  newWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const levelName = levels[level] || 'LOG'
    const source = sourceId ? sourceId.split('/').pop() : 'unknown'
    console.log(`[Renderer ${levelName}] ${source}:${line} - ${message}`)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    newWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    newWindow.webContents.openDevTools()
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle initial path (from file open or env var)
  const pathToOpen = initialPath || fileToOpen
  if (pathToOpen) {
    newWindow.webContents.on('did-finish-load', () => {
      newWindow.webContents.send('nav:goto', pathToOpen)
    })
    if (!initialPath) fileToOpen = null  // Clear global only if it was the source
  }

  return newWindow
}

// Install shell command for CLI access
async function installShellCommand(): Promise<void> {
  const shellCommandPath = '/usr/local/bin/altfinder'
  const appPath = app.isPackaged
    ? path.join(path.dirname(app.getPath('exe')), '..', '..', '..')
    : path.join(__dirname, '../dist/mac-arm64/AltFinder.app')

  // Check if already installed
  if (existsSync(shellCommandPath)) {
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Shell Command',
      message: 'Shell command already installed',
      detail: 'The "altfinder" command is already available in your terminal.\n\nUsage: altfinder /path/to/folder',
      buttons: ['OK', 'Reinstall'],
      defaultId: 0
    })
    if (result.response === 0) return
  }

  const script = `#!/bin/bash
open -a "${appPath}" "$@"
`

  // Use osascript to run with admin privileges
  const escapedScript = script.replace(/"/g, '\\"').replace(/\n/g, '\\n')
  const command = `osascript -e 'do shell script "echo \\"${escapedScript}\\" > ${shellCommandPath} && chmod +x ${shellCommandPath}" with administrator privileges'`

  try {
    await execAsync(command)
    await dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Shell Command Installed',
      message: 'Successfully installed "altfinder" command',
      detail: 'You can now open folders from Terminal:\n\naltfinder .\naltfinder ~/Documents\naltfinder /any/path',
      buttons: ['OK']
    })
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).message?.includes('User canceled')) {
      return
    }
    await dialog.showMessageBox(mainWindow!, {
      type: 'error',
      title: 'Installation Failed',
      message: 'Failed to install shell command',
      detail: (error as Error).message || 'Unknown error',
      buttons: ['OK']
    })
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
        {
          label: 'Install Shell Command...',
          click: () => installShellCommand()
        },
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
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow()
        },
        {
          label: 'New Folder',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => getFocusedWindow()?.webContents.send('menu:newFolder')
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
          accelerator: 'CmdOrCtrl+Shift+.',
          checked: store.get('showHiddenFiles'),
          click: (menuItem) => {
            store.set('showHiddenFiles', menuItem.checked)
            // Send to all windows
            BrowserWindow.getAllWindows().forEach(win => {
              win.webContents.send('settings:showHiddenFiles', menuItem.checked)
            })
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
          click: () => getFocusedWindow()?.webContents.send('nav:back')
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => getFocusedWindow()?.webContents.send('nav:forward')
        },
        {
          label: 'Enclosing Folder',
          accelerator: 'CmdOrCtrl+Up',
          click: () => getFocusedWindow()?.webContents.send('nav:up')
        },
        { type: 'separator' },
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => getFocusedWindow()?.webContents.send('nav:goto', app.getPath('home'))
        },
        {
          label: 'Desktop',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => getFocusedWindow()?.webContents.send('nav:goto', app.getPath('desktop'))
        },
        {
          label: 'Documents',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => getFocusedWindow()?.webContents.send('nav:goto', app.getPath('documents'))
        },
        {
          label: 'Downloads',
          accelerator: 'CmdOrCtrl+Option+L',
          click: () => getFocusedWindow()?.webContents.send('nav:goto', app.getPath('downloads'))
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

app.whenReady().then(async () => {
  // Migrate legacy pins to manifest files
  await migrateLegacyPins()

  createMenu()
  createWindow()
  setupFavoritesWatcher()
  setupFocusHandler()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      setupFocusHandler()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers

ipcMain.handle('fs:readDirectory', async (_, dirPath: string, showHidden: boolean, limit?: number) => {
  return readDirectory(dirPath, showHidden, limit)
})

ipcMain.handle('fs:readDirectoryFast', async (_, dirPath: string, showHidden: boolean, limit?: number) => {
  return readDirectoryFast(dirPath, showHidden, limit)
})

ipcMain.handle('fs:getFilesMetadata', async (_, filePaths: string[]) => {
  return getFilesMetadata(filePaths)
})

ipcMain.handle('fs:readDirectoryWithMeta', async (_, dirPath: string, showHidden: boolean, limit?: number) => {
  return readDirectoryWithMeta(dirPath, showHidden, limit)
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

// Pinned files (manifest-based)
ipcMain.handle('pins:get', async (_, dirPath: string) => {
  return getPinnedFiles(dirPath)
})

ipcMain.handle('pins:set', async (_, dirPath: string, pinnedPaths: string[]) => {
  return setPinnedFiles(dirPath, pinnedPaths)
})

ipcMain.handle('pins:add', async (_, dirPath: string, filePath: string) => {
  const current = await getPinnedFiles(dirPath)
  if (!current.includes(filePath)) {
    current.push(filePath)
    await setPinnedFiles(dirPath, current)
  }
  return current
})

ipcMain.handle('pins:remove', async (_, dirPath: string, filePath: string) => {
  const current = await getPinnedFiles(dirPath)
  const updated = current.filter(p => p !== filePath)
  await setPinnedFiles(dirPath, updated)
  return updated
})

// Get all pinned files across all directories (reads from manifests)
ipcMain.handle('pins:getAll', async () => {
  const pinnedDirs = store.get('pinnedDirectories')
  const allPinned: { file: FileInfo; sourceDir: string }[] = []
  const validDirs: string[] = []

  for (const dirPath of pinnedDirs) {
    // Check if directory still exists
    if (!existsSync(dirPath)) continue

    const pinnedFiles = await getPinnedFiles(dirPath)
    if (pinnedFiles.length === 0) continue

    validDirs.push(dirPath)

    for (const filePath of pinnedFiles) {
      try {
        const stats = await fs.stat(filePath)
        const name = path.basename(filePath)
        allPinned.push({
          file: {
            name,
            path: filePath,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modifiedTime: stats.mtimeMs,
            createdTime: stats.birthtimeMs,
            kind: getFileKind(name, stats.isDirectory()),
            extension: path.extname(name).toLowerCase()
          },
          sourceDir: dirPath
        })
      } catch {
        // File no longer exists, skip it
      }
    }
  }

  // Clean up index if directories were removed
  if (validDirs.length !== pinnedDirs.length) {
    store.set('pinnedDirectories', validDirs)
  }

  return allPinned
})

// Settings
ipcMain.handle('settings:getShowHiddenFiles', () => store.get('showHiddenFiles'))
ipcMain.handle('settings:setShowHiddenFiles', (_, value: boolean) => {
  store.set('showHiddenFiles', value)
})

ipcMain.handle('settings:getSortOrder', (_, dirPath: string) => {
  const sort = store.get('folderSort') || {}
  return sort[dirPath] || { field: 'name', direction: 'asc' }
})

ipcMain.handle('settings:setSortOrder', (_, dirPath: string, config: { field: string; direction: string }) => {
  const sort = store.get('folderSort') || {}
  sort[dirPath] = config
  store.set('folderSort', sort)
})

// Finder favorites - async and cached
let cachedFinderFavorites: { name: string; path: string }[] | null = null
let finderFavoritesLoading = false

async function getFinderFavorites(): Promise<{ name: string; path: string }[]> {
  // Return cache if available
  if (cachedFinderFavorites !== null) {
    return cachedFinderFavorites
  }

  // Prevent multiple simultaneous loads
  if (finderFavoritesLoading) {
    return []
  }

  finderFavoritesLoading = true

  try {
    const scriptPath = path.join(__dirname, '../scripts/read-finder-favorites.swift')
    if (!existsSync(scriptPath)) {
      finderFavoritesLoading = false
      return []
    }

    const { stdout } = await execAsync(`swift "${scriptPath}"`, { timeout: 10000 })
    const favorites = JSON.parse(stdout)
    // Filter out empty entries and special items
    cachedFinderFavorites = favorites.filter((f: { name: string; path: string }) =>
      f.name && f.path && !f.path.includes('.cannedSearch')
    )
    finderFavoritesLoading = false
    return cachedFinderFavorites
  } catch (error) {
    console.error('Failed to read Finder favorites:', error)
    finderFavoritesLoading = false
    // Return default favorites as fallback
    const home = homedir()
    return [
      { name: 'Desktop', path: path.join(home, 'Desktop') },
      { name: 'Documents', path: path.join(home, 'Documents') },
      { name: 'Downloads', path: path.join(home, 'Downloads') },
      { name: 'Applications', path: '/Applications' },
    ]
  }
}

// Invalidate cache when favorites file changes
function invalidateFinderFavoritesCache() {
  cachedFinderFavorites = null
}

ipcMain.handle('fs:getFinderFavorites', async () => {
  return getFinderFavorites()
})

ipcMain.handle('system:openTerminal', (_, dirPath: string) => {
  if (process.platform === 'darwin') {
    exec(`open -a Terminal "${dirPath}"`)
  }
})

ipcMain.handle('clipboard:writeText', (_, text: string) => {
  clipboard.writeText(text)
})

// Watch Finder favorites file for changes
const favoritesFilePath = path.join(
  homedir(),
  'Library/Application Support/com.apple.sharedfilelist/com.apple.LSSharedFileList.FavoriteItems.sfl3'
)

let favoritesWatcher: ReturnType<typeof watch> | null = null

function setupFavoritesWatcher() {
  if (favoritesWatcher) return

  try {
    const favoritesDir = path.dirname(favoritesFilePath)
    if (existsSync(favoritesDir)) {
      favoritesWatcher = watch(favoritesDir, (eventType, filename) => {
        if (filename && filename.includes('FavoriteItems')) {
          console.log('Finder favorites changed, invalidating cache...')
          invalidateFinderFavoritesCache()
          mainWindow?.webContents.send('favorites:changed')
        }
      })
      console.log('Watching Finder favorites for changes')
    }
  } catch (error) {
    console.error('Failed to watch Finder favorites:', error)
  }
}

// Reload favorites when window gains focus
function setupFocusHandler() {
  if (mainWindow) {
    mainWindow.on('focus', () => {
      console.log('Window focused, sending favorites refresh signal')
      mainWindow?.webContents.send('favorites:changed')
    })
  }
}
