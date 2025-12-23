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
}

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => {
  if (!direction) return null
  return (
    <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
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
  loading
}: FileListProps) {
  const [newFolderName, setNewFolderName] = useState('untitled folder')
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus()
      newFolderInputRef.current.select()
    }
  }, [creatingFolder])

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

  const gridClass = "grid grid-cols-[1fr] md:grid-cols-[minmax(200px,1fr)_160px] lg:grid-cols-[minmax(200px,1fr)_160px_100px] xl:grid-cols-[minmax(200px,1fr)_160px_100px_120px] gap-4 px-4 items-center"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`sticky top-0 z-10 py-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ${gridClass}`}>
        <button
          onClick={() => onSort('name')}
          className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left"
        >
          Name
          <SortIcon direction={sortConfig.field === 'name' ? sortConfig.direction : null} />
        </button>
        <button
          onClick={() => onSort('modifiedTime')}
          className="hidden md:flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left"
        >
          Date Modified
          <SortIcon direction={sortConfig.field === 'modifiedTime' ? sortConfig.direction : null} />
        </button>
        <button
          onClick={() => onSort('size')}
          className="hidden lg:flex items-center justify-end hover:text-neutral-700 dark:hover:text-neutral-200 text-right"
        >
          Size
          <SortIcon direction={sortConfig.field === 'size' ? sortConfig.direction : null} />
        </button>
        <button
          onClick={() => onSort('kind')}
          className="hidden xl:flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 text-left"
        >
          Kind
          <SortIcon direction={sortConfig.field === 'kind' ? sortConfig.direction : null} />
        </button>
      </div>

      <div className="pb-2">
        {/* Pinned section */}
        {pinnedFiles.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-2">
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
            <div className="my-2 border-b border-neutral-200 dark:border-neutral-800 mx-4" />
          </>
        )}

        {/* New folder row */}
        {creatingFolder && (
          <div className={`${gridClass} py-1.5`}>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </span>
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
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-neutral-800 border-2 border-blue-500 rounded-md focus:outline-none shadow-sm"
              />
            </div>
            <div className="hidden md:block text-sm text-neutral-400">--</div>
            <div className="hidden lg:block text-sm text-neutral-400 text-right">--</div>
            <div className="hidden xl:block text-sm text-neutral-400">Folder</div>
          </div>
        )}

        {/* Files */}
        {files.length === 0 && pinnedFiles.length === 0 && !creatingFolder ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            <svg className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 012 2v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5a2 2 0 01-2-2z" />
            </svg>
            <p>This folder is empty</p>
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
