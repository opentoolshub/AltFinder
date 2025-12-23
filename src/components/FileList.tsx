import { useState, useRef, useEffect } from 'react'
import FileRow from './FileRow'

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

interface PinnedFileWithSource {
  file: FileInfo
  sourceDir: string
}

interface FileListProps {
  files: FileInfo[]
  pinnedFiles: FileInfo[]
  selectedFiles: Set<string>
  sortConfig: SortConfig
  onSort: (field: SortConfig['field']) => void
  onSelect: (file: FileInfo, multiSelect: boolean) => void
  onOpen: (file: FileInfo) => void
  onContextMenu: (e: React.MouseEvent, file: FileInfo) => void
  renaming: string | null
  onRename: (oldPath: string, newName: string) => void
  onCancelRename: () => void
  creatingFolder: boolean
  onCreateFolder: (name: string) => void
  onCancelCreate: () => void
  pinnedPaths: string[]
  loading: boolean
  isAllPinnedView?: boolean
  allPinnedFiles?: PinnedFileWithSource[]
  onNavigateToFolder?: (path: string) => void
}

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => {
  if (!direction) return null
  return (
    <svg className="w-3 h-3 ml-1 opacity-70" fill="currentColor" viewBox="0 0 20 20">
      {direction === 'asc' ? (
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      )}
    </svg>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '--'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) {
    return 'Today, ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  if (isYesterday) {
    return 'Yesterday, ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FileList({
  files,
  pinnedFiles,
  selectedFiles,
  sortConfig,
  onSort,
  onSelect,
  onOpen,
  onContextMenu,
  renaming,
  onRename,
  onCancelRename,
  creatingFolder,
  onCreateFolder,
  onCancelCreate,
  pinnedPaths,
  loading,
  isAllPinnedView = false,
  allPinnedFiles = [],
  onNavigateToFolder
}: FileListProps) {
  const [newFolderName, setNewFolderName] = useState('untitled folder')
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; path: string } | null>(null)
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus()
      newFolderInputRef.current.select()
    }
  }, [creatingFolder])

  // Close folder context menu on click outside
  useEffect(() => {
    if (folderContextMenu) {
      const handleClick = () => setFolderContextMenu(null)
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [folderContextMenu])

  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (newFolderName.trim()) {
        onCreateFolder(newFolderName.trim())
      }
      setNewFolderName('untitled folder')
    } else if (e.key === 'Escape') {
      onCancelCreate()
      setNewFolderName('untitled folder')
    }
  }

  const gridClass = "grid min-w-[600px] grid-cols-[minmax(280px,1fr)_140px_80px_110px] gap-x-4 px-4 items-center"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[13px]">Loading...</span>
        </div>
      </div>
    )
  }

  // All Pinned View
  if (isAllPinnedView) {
    // Group files by source directory
    const groupedByDir: Record<string, { file: FileInfo; sourceDir: string }[]> = {}
    for (const item of allPinnedFiles) {
      if (!groupedByDir[item.sourceDir]) {
        groupedByDir[item.sourceDir] = []
      }
      groupedByDir[item.sourceDir].push(item)
    }

    const dirPaths = Object.keys(groupedByDir).sort()

    if (allPinnedFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-400 dark:text-neutral-500">
          <svg className="w-16 h-16 mb-4 text-amber-200 dark:text-amber-900/50" viewBox="0 0 64 64" fill="none">
            <path d="M32 8L40 24H56L44 36L48 56L32 46L16 56L20 36L8 24H24L32 8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-[13px] font-medium">No pinned files yet</p>
          <p className="text-[12px] text-neutral-400 dark:text-neutral-600 mt-1">Right-click files to pin them</p>
        </div>
      )
    }

    const handleFolderContextMenu = (e: React.MouseEvent, path: string) => {
      e.preventDefault()
      setFolderContextMenu({ x: e.clientX, y: e.clientY, path })
    }

    const handleCopyFolderPath = () => {
      if (folderContextMenu) {
        window.electron.writeTextToClipboard(folderContextMenu.path)
        setFolderContextMenu(null)
      }
    }

    // Sort function for files within groups
    const sortFiles = (items: { file: FileInfo; sourceDir: string }[]) => {
      return [...items].sort((a, b) => {
        const aVal = a.file[sortConfig.field]
        const bVal = b.file[sortConfig.field]
        const modifier = sortConfig.direction === 'asc' ? 1 : -1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * modifier
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * modifier
        }
        return 0
      })
    }

    return (
      <>
        <div className="w-full min-w-full pb-4">
          {/* Header */}
          <div className={`sticky top-0 z-10 py-2.5 bg-white/90 dark:bg-[#151515]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide ${gridClass}`}>
            <button
              onClick={() => onSort('name')}
              className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left transition-colors"
            >
              Name
              <SortIcon direction={sortConfig.field === 'name' ? sortConfig.direction : null} />
            </button>
            <button
              onClick={() => onSort('modifiedTime')}
              className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left transition-colors"
            >
              Date Modified
              <SortIcon direction={sortConfig.field === 'modifiedTime' ? sortConfig.direction : null} />
            </button>
            <button
              onClick={() => onSort('size')}
              className="flex items-center justify-end hover:text-neutral-700 dark:hover:text-neutral-200 text-right transition-colors"
            >
              Size
              <SortIcon direction={sortConfig.field === 'size' ? sortConfig.direction : null} />
            </button>
            <button
              onClick={() => onSort('kind')}
              className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left transition-colors"
            >
              Kind
              <SortIcon direction={sortConfig.field === 'kind' ? sortConfig.direction : null} />
            </button>
          </div>

          <div className="pt-1 px-2">
            {dirPaths.map((dirPath) => {
              const items = sortFiles(groupedByDir[dirPath])
              const dirName = dirPath.split('/').pop() || dirPath

              return (
                <div key={dirPath} className="mb-4">
                  {/* Directory header */}
                  <button
                    onClick={() => onNavigateToFolder?.(dirPath)}
                    onContextMenu={(e) => handleFolderContextMenu(e, dirPath)}
                    className="px-4 py-2 text-[11px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide flex items-center gap-2 hover:text-[#0A84FF] transition-colors group w-full text-left"
                    title={`Go to ${dirPath}`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#007AFF] group-hover:text-[#0A84FF]" viewBox="0 0 20 20" fill="none">
                      <defs>
                        <linearGradient id={`folderGrad-${dirPath.replace(/\//g, '-')}`} x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#5AC8FA" />
                          <stop offset="1" stopColor="#007AFF" />
                        </linearGradient>
                      </defs>
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill={`url(#folderGrad-${dirPath.replace(/\//g, '-')})`} />
                    </svg>
                    <span className="truncate">{dirName}</span>
                    <span className="text-neutral-400 dark:text-neutral-600 font-normal normal-case">
                      ({items.length})
                    </span>
                    <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Files in this directory */}
                  {items.map(({ file }) => (
                    <FileRow
                      key={file.path}
                      file={file}
                      isSelected={selectedFiles.has(file.path)}
                      isPinned={true}
                      isRenaming={renaming === file.path}
                      onSelect={onSelect}
                      onOpen={onOpen}
                      onContextMenu={onContextMenu}
                      onRename={onRename}
                      onCancelRename={onCancelRename}
                      formatSize={formatFileSize}
                      formatDate={formatDate}
                      gridClass={gridClass}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Folder context menu */}
        {folderContextMenu && (
          <div
            className="fixed z-50 min-w-[180px] py-1 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-neutral-200/50 dark:border-white/10"
            style={{ left: folderContextMenu.x, top: folderContextMenu.y }}
          >
            <button
              onClick={() => {
                onNavigateToFolder?.(folderContextMenu.path)
                setFolderContextMenu(null)
              }}
              className="w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center gap-2 transition-all duration-75 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white"
              style={{ width: 'calc(100% - 8px)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Open Folder
            </button>
            <div className="my-1 mx-2 border-t border-neutral-200/60 dark:border-white/10" />
            <button
              onClick={handleCopyFolderPath}
              className="w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center gap-2 transition-all duration-75 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white"
              style={{ width: 'calc(100% - 8px)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Folder Path
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="w-full min-w-full pb-4">
      {/* Header */}
      <div className={`sticky top-0 z-10 py-2.5 bg-white/90 dark:bg-[#151515]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide ${gridClass}`}>
        <button
          onClick={() => onSort('name')}
          className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left transition-colors"
        >
          Name
          <SortIcon direction={sortConfig.field === 'name' ? sortConfig.direction : null} />
        </button>
        <button
          onClick={() => onSort('modifiedTime')}
          className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left transition-colors"
        >
          Date Modified
          <SortIcon direction={sortConfig.field === 'modifiedTime' ? sortConfig.direction : null} />
        </button>
        <button
          onClick={() => onSort('size')}
          className="flex items-center justify-end hover:text-neutral-700 dark:hover:text-neutral-200 text-right transition-colors"
        >
          Size
          <SortIcon direction={sortConfig.field === 'size' ? sortConfig.direction : null} />
        </button>
        <button
          onClick={() => onSort('kind')}
          className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left transition-colors"
        >
          Kind
          <SortIcon direction={sortConfig.field === 'kind' ? sortConfig.direction : null} />
        </button>
      </div>

      <div className="pt-1 px-2">
        {/* Pinned section */}
        {pinnedFiles.length > 0 && (
          <>
            <div className="px-4 py-2 text-[11px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
              Pinned
            </div>
            {pinnedFiles.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                isSelected={selectedFiles.has(file.path)}
                isPinned={true}
                isRenaming={renaming === file.path}
                onSelect={onSelect}
                onOpen={onOpen}
                onContextMenu={onContextMenu}
                onRename={onRename}
                onCancelRename={onCancelRename}
                formatSize={formatFileSize}
                formatDate={formatDate}
                gridClass={gridClass}
              />
            ))}
            <div className="my-3 border-b border-neutral-200/60 dark:border-white/5 mx-4" />
          </>
        )}

        {/* New folder row */}
        {creatingFolder && (
          <div className={`${gridClass} py-[7px] rounded-md bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20`}>
            <div className="flex items-center gap-2.5">
              <svg className="w-[20px] h-[20px]" viewBox="0 0 20 20" fill="none">
                <defs>
                  <linearGradient id="newFolderGradient" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#5AC8FA" />
                    <stop offset="1" stopColor="#007AFF" />
                  </linearGradient>
                </defs>
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="url(#newFolderGradient)" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
              </svg>
              <input
                ref={newFolderInputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleNewFolderKeyDown}
                onBlur={() => {
                  if (newFolderName.trim()) {
                    onCreateFolder(newFolderName.trim())
                  } else {
                    onCancelCreate()
                  }
                  setNewFolderName('untitled folder')
                }}
                className="flex-1 px-2 py-1 text-[13px] bg-white dark:bg-[#2a2a2a] text-neutral-900 dark:text-white border border-[#0A84FF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30 shadow-sm"
              />
            </div>
            <div className="text-[13px] text-neutral-400">--</div>
            <div className="text-[13px] text-neutral-400 text-right">--</div>
            <div className="text-[13px] text-neutral-400">Folder</div>
          </div>
        )}

        {/* Files */}
        {files.length === 0 && pinnedFiles.length === 0 && !creatingFolder ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400 dark:text-neutral-500">
            <svg className="w-16 h-16 mb-4 text-neutral-200 dark:text-neutral-700" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="emptyFolderGradient" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path d="M8 20C8 16.6863 10.6863 14 14 14H24L30 20H50C53.3137 20 56 22.6863 56 26V48C56 51.3137 53.3137 54 50 54H14C10.6863 54 8 51.3137 8 48V20Z" fill="url(#emptyFolderGradient)" stroke="currentColor" strokeWidth="2" />
            </svg>
            <p className="text-[13px] font-medium">This folder is empty</p>
          </div>
        ) : (
          files.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              isSelected={selectedFiles.has(file.path)}
              isPinned={pinnedPaths.includes(file.path)}
              isRenaming={renaming === file.path}
              onSelect={onSelect}
              onOpen={onOpen}
              onContextMenu={onContextMenu}
              onRename={onRename}
              onCancelRename={onCancelRename}
              formatSize={formatFileSize}
              formatDate={formatDate}
              gridClass={gridClass}
            />
          ))
        )}
      </div>
    </div>
  )
}
