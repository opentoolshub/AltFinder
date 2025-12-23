import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'

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

type SortField = 'name' | 'modifiedTime' | 'createdTime' | 'size' | 'kind'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

interface ClipboardState {
  files: string[]
  operation: 'copy' | 'cut' | null
}

interface FinderFavorite {
  name: string
  path: string
}

import PathBar from './components/PathBar'
import Toolbar from './components/Toolbar'
import FileList from './components/FileList'
import ContextMenu from './components/ContextMenu'

function App() {
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [pinnedFiles, setPinnedFiles] = useState<FileInfo[]>([])
  const [pinnedPaths, setPinnedPaths] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' })
  const [showHiddenFiles, setShowHiddenFiles] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clipboard, setClipboard] = useState<ClipboardState>({ files: [], operation: null })
  const [finderFavorites, setFinderFavorites] = useState<FinderFavorite[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileInfo | null } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [homePath, setHomePath] = useState<string>('/')
  const fileListRef = useRef<HTMLDivElement>(null)

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing app...')
        if (!window.electron) {
          throw new Error('Electron API not available - preload script may not have loaded')
        }
        console.log('Getting special paths...')
        const paths = await window.electron.getSpecialPaths()
        console.log('Special paths:', paths)
        setHomePath(paths.home)

        // Load Finder favorites
        console.log('Loading Finder favorites...')
        const favorites = await window.electron.getFinderFavorites()
        console.log('Finder favorites:', favorites)
        setFinderFavorites(favorites)
        setFavoritesLoading(false)

        const hidden = await window.electron.getShowHiddenFiles()
        setShowHiddenFiles(hidden)
        navigateTo(paths.home, true)
      } catch (err) {
        console.error('Init error:', err)
        setError(err instanceof Error ? err.message : String(err))
        setFavoritesLoading(false)
      }
    }
    init()
  }, [])

  // Listen for menu events
  useEffect(() => {
    if (!window.electron) return

    const unsubBack = window.electron.onNavBack(() => goBack())
    const unsubForward = window.electron.onNavForward(() => goForward())
    const unsubUp = window.electron.onNavUp(() => goUp())
    const unsubGoto = window.electron.onNavGoto((path) => navigateTo(path))
    const unsubNewFolder = window.electron.onNewFolder(() => setCreatingFolder(true))
    const unsubHidden = window.electron.onShowHiddenFilesChange((value) => {
      setShowHiddenFiles(value)
    })

    return () => {
      unsubBack()
      unsubForward()
      unsubUp()
      unsubGoto()
      unsubNewFolder()
      unsubHidden()
    }
  }, [history, historyIndex, currentPath])

  // Listen for favorites changes (file watch + window focus)
  useEffect(() => {
    if (!window.electron) return

    const unsubFavorites = window.electron.onFavoritesChanged(async () => {
      console.log('Reloading Finder favorites...')
      const favorites = await window.electron.getFinderFavorites()
      setFinderFavorites(favorites)
    })

    return () => {
      unsubFavorites()
    }
  }, [])

  // Load directory when path or showHiddenFiles changes
  useEffect(() => {
    if (currentPath) {
      loadDirectory(currentPath)
    }
  }, [currentPath, showHiddenFiles])

  const loadDirectory = async (dirPath: string) => {
    if (!window.electron) return
    setLoading(true)
    try {
      const allFiles = await window.electron.readDirectory(dirPath, showHiddenFiles)
      setFiles(allFiles)

      // Load sort config
      const savedSort = await window.electron.getSortOrder(dirPath)
      setSortConfig(savedSort)

      // Load pinned files for this directory
      const pins = await window.electron.getPinnedFiles(dirPath)
      setPinnedPaths(pins)

      // Get FileInfo for each pinned file that still exists
      const pinnedInfos: FileInfo[] = []
      for (const pinPath of pins) {
        const exists = await window.electron.exists(pinPath)
        if (exists) {
          const info = await window.electron.getFileInfo(pinPath)
          pinnedInfos.push(info)
        }
      }
      setPinnedFiles(pinnedInfos)
    } catch (error) {
      console.error('Failed to read directory:', error)
      setFiles([])
      setPinnedFiles([])
      setPinnedPaths([])
    }
    setLoading(false)
  }

  const navigateTo = useCallback((path: string, initial = false) => {
    if (initial) {
      setHistory([path])
      setHistoryIndex(0)
    } else {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(path)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
    setCurrentPath(path)
    setSelectedFiles(new Set())
    setSearchQuery('')
    setRenaming(null)
    setCreatingFolder(false)
  }, [history, historyIndex])

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentPath(history[historyIndex - 1])
      setSelectedFiles(new Set())
    }
  }, [history, historyIndex])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentPath(history[historyIndex + 1])
      setSelectedFiles(new Set())
    }
  }, [history, historyIndex])

  const goUp = useCallback(() => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
    if (parent !== currentPath) {
      navigateTo(parent)
    }
  }, [currentPath, navigateTo])

  const handleFileOpen = async (file: FileInfo) => {
    if (file.isDirectory) {
      navigateTo(file.path)
    } else {
      await window.electron.openFile(file.path)
    }
  }

  const handleFileSelect = (file: FileInfo, multiSelect: boolean) => {
    if (multiSelect) {
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path)
      } else {
        newSelected.add(file.path)
      }
      setSelectedFiles(newSelected)
    } else {
      setSelectedFiles(new Set([file.path]))
    }
  }

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => {
      const newConfig: SortConfig = {
        field,
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }
      window.electron.setSortOrder(currentPath, newConfig)
      return newConfig
    })
  }

  const handleCopy = () => {
    if (selectedFiles.size > 0) {
      setClipboard({ files: Array.from(selectedFiles), operation: 'copy' })
    }
  }

  const handleCut = () => {
    if (selectedFiles.size > 0) {
      setClipboard({ files: Array.from(selectedFiles), operation: 'cut' })
    }
  }

  const handlePaste = async () => {
    if (clipboard.files.length > 0 && clipboard.operation) {
      try {
        if (clipboard.operation === 'copy') {
          await window.electron.copy(clipboard.files, currentPath)
        } else {
          await window.electron.move(clipboard.files, currentPath)
          setClipboard({ files: [], operation: null })
        }
        await loadDirectory(currentPath)
      } catch (error) {
        console.error('Paste failed:', error)
      }
    }
  }

  const handleDelete = async () => {
    if (selectedFiles.size > 0) {
      try {
        for (const filePath of selectedFiles) {
          await window.electron.trashItem(filePath)
        }
        setSelectedFiles(new Set())
        await loadDirectory(currentPath)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      await window.electron.rename(oldPath, newName)
      setRenaming(null)
      await loadDirectory(currentPath)
    } catch (error) {
      console.error('Rename failed:', error)
    }
  }

  const handleCreateFolder = async (name: string) => {
    try {
      await window.electron.createFolder(currentPath, name)
      setCreatingFolder(false)
      await loadDirectory(currentPath)
    } catch (error) {
      console.error('Create folder failed:', error)
    }
  }

  const handlePin = async (file: FileInfo) => {
    if (pinnedPaths.includes(file.path)) {
      const newPins = await window.electron.removePinnedFile(currentPath, file.path)
      setPinnedPaths(newPins)
      setPinnedFiles(pinnedFiles.filter(f => f.path !== file.path))
    } else {
      const newPins = await window.electron.addPinnedFile(currentPath, file.path)
      setPinnedPaths(newPins)
      setPinnedFiles([...pinnedFiles, file])
    }
  }

  const handleContextMenu = (e: React.MouseEvent, file: FileInfo | null) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input
      if (e.target instanceof HTMLInputElement) return

      const isMeta = e.metaKey || e.ctrlKey

      if (isMeta && e.key === 'c') {
        e.preventDefault()
        handleCopy()
      } else if (isMeta && e.key === 'x') {
        e.preventDefault()
        handleCut()
      } else if (isMeta && e.key === 'v') {
        e.preventDefault()
        handlePaste()
      } else if (e.key === 'Backspace' && isMeta) {
        e.preventDefault()
        handleDelete()
      } else if (e.key === 'Enter' && selectedFiles.size === 1 && !renaming) {
        e.preventDefault()
        setRenaming(Array.from(selectedFiles)[0])
      } else if (e.key === 'Escape') {
        setRenaming(null)
        setCreatingFolder(false)
        setSelectedFiles(new Set())
        closeContextMenu()
      } else if (isMeta && e.key === 'a') {
        e.preventDefault()
        const allPaths = [...pinnedFiles, ...files].map(f => f.path)
        setSelectedFiles(new Set(allPaths))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFiles, clipboard, pinnedFiles, files, renaming])

  // Filter and sort files
  const filteredFiles = files.filter(f => {
    // Filter out pinned files from main list
    if (pinnedPaths.includes(f.path)) return false
    // Apply search filter
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    // Folders first
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1

    let comparison = 0
    switch (sortConfig.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'modifiedTime':
        comparison = a.modifiedTime - b.modifiedTime
        break
      case 'createdTime':
        comparison = a.createdTime - b.createdTime
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'kind':
        comparison = a.kind.localeCompare(b.kind)
        break
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison
  })

  // Filter pinned files by search query
  const filteredPinnedFiles = pinnedFiles.filter(f => {
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full bg-transparent text-neutral-900 dark:text-neutral-100 font-sans select-none">
      {/* Sidebar */}
      <Sidebar
        favorites={finderFavorites}
        currentPath={currentPath}
        onNavigate={navigateTo}
        loading={favoritesLoading}
        homePath={homePath}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e]">
        {/* Toolbar */}
        <Toolbar
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          onBack={goBack}
          onForward={goForward}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Path bar */}
        <PathBar path={currentPath} onNavigate={navigateTo} />

        {/* File list */}
        <div
          ref={fileListRef}
          className="flex-1 overflow-auto w-full min-w-0"
          onClick={(e) => {
            if (e.target === fileListRef.current) {
              setSelectedFiles(new Set())
            }
          }}
          onContextMenu={(e) => {
            if (e.target === fileListRef.current) {
              handleContextMenu(e, null)
            }
          }}
        >
          <FileList
            files={sortedFiles}
            pinnedFiles={filteredPinnedFiles}
            selectedFiles={selectedFiles}
            sortConfig={sortConfig}
            onSort={handleSort}
            onSelect={handleFileSelect}
            onOpen={handleFileOpen}
            onContextMenu={handleContextMenu}
            renaming={renaming}
            onRename={handleRename}
            onCancelRename={() => setRenaming(null)}
            creatingFolder={creatingFolder}
            onCreateFolder={handleCreateFolder}
            onCancelCreate={() => setCreatingFolder(false)}
            pinnedPaths={pinnedPaths}
            loading={loading}
          />
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          isPinned={contextMenu.file ? pinnedPaths.includes(contextMenu.file.path) : false}
          hasClipboard={clipboard.files.length > 0}
          onClose={closeContextMenu}
          onOpen={() => {
            if (contextMenu.file) handleFileOpen(contextMenu.file)
            closeContextMenu()
          }}
          onPin={() => {
            if (contextMenu.file) handlePin(contextMenu.file)
            closeContextMenu()
          }}
          onCopy={() => {
            if (contextMenu.file) {
              setSelectedFiles(new Set([contextMenu.file.path]))
              handleCopy()
            }
            closeContextMenu()
          }}
          onCut={() => {
            if (contextMenu.file) {
              setSelectedFiles(new Set([contextMenu.file.path]))
              handleCut()
            }
            closeContextMenu()
          }}
          onPaste={() => {
            handlePaste()
            closeContextMenu()
          }}
          onDelete={() => {
            if (contextMenu.file) {
              setSelectedFiles(new Set([contextMenu.file.path]))
            }
            handleDelete()
            closeContextMenu()
          }}
          onRename={() => {
            if (contextMenu.file) {
              setRenaming(contextMenu.file.path)
            }
            closeContextMenu()
          }}
          onShowInFinder={() => {
            if (contextMenu.file) {
              window.electron.showInFinder(contextMenu.file.path)
            }
            closeContextMenu()
          }}
          onNewFolder={() => {
            setCreatingFolder(true)
            closeContextMenu()
          }}
          onCopyPath={() => {
            const path = contextMenu.file ? contextMenu.file.path : currentPath
            window.electron.writeTextToClipboard(path)
            closeContextMenu()
          }}
          onOpenTerminal={() => {
            const path = contextMenu.file && contextMenu.file.isDirectory 
              ? contextMenu.file.path 
              : currentPath
            window.electron.openTerminal(path)
            closeContextMenu()
          }}
        />
      )}
    </div>
  )
}

export default App
