import { useState, useRef, useEffect } from 'react'
import { FileInfo, SortConfig } from '../types'
import FileRow from './FileRow'

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

  const columns: { key: SortConfig['field']; label: string; width: string }[] = [
    { key: 'name', label: 'Name', width: 'flex-1 min-w-[200px]' },
    { key: 'modifiedTime', label: 'Date Modified', width: 'w-40' },
    { key: 'size', label: 'Size', width: 'w-24 text-right' },
    { key: 'kind', label: 'Kind', width: 'w-32' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-w-fit">
      {/* Header */}
      <div className="flex items-center px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider sticky top-0 z-10">
        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => onSort(col.key)}
            className={`flex items-center hover:text-neutral-700 dark:hover:text-neutral-200 ${col.width} ${col.key === 'size' ? 'justify-end' : ''}`}
          >
            {col.label}
            <SortIcon direction={sortConfig.field === col.key ? sortConfig.direction : null} />
          </button>
        ))}
      </div>

      {/* Pinned section */}
      {pinnedFiles.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
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
            />
          ))}
          <div className="h-2 border-b border-neutral-200 dark:border-neutral-700" />
        </>
      )}

      {/* New folder row */}
      {creatingFolder && (
        <div className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-blue-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
              className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-neutral-700 border border-blue-500 rounded focus:outline-none"
            />
          </div>
          <div className="w-40 text-sm text-neutral-500">--</div>
          <div className="w-24 text-sm text-neutral-500 text-right">--</div>
          <div className="w-32 text-sm text-neutral-500">Folder</div>
        </div>
      )}

      {/* Files */}
      {files.length === 0 && pinnedFiles.length === 0 && !creatingFolder ? (
        <div className="flex items-center justify-center h-32 text-neutral-500">
          This folder is empty
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
          />
        ))
      )}
    </div>
  )
}
