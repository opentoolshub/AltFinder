import { useState, useRef, useEffect } from 'react'

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

interface FileRowProps {
  file: FileInfo
  isSelected: boolean
  isPinned: boolean
  isRenaming: boolean
  onSelect: (file: FileInfo, multiSelect: boolean) => void
  onOpen: (file: FileInfo) => void
  onContextMenu: (e: React.MouseEvent, file: FileInfo) => void
  onRename: (oldPath: string, newName: string) => void
  onCancelRename: () => void
  formatSize: (bytes: number) => string
  formatDate: (timestamp: number) => string
  gridClass?: string
}

const FolderIcon = () => (
  <svg className="w-[20px] h-[20px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="folderGradientRow" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path
      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      fill="url(#folderGradientRow)"
      stroke="rgba(0,0,0,0.08)"
      strokeWidth="0.5"
    />
  </svg>
)

const FileIcon = ({ extension }: { extension: string }) => {
  // Color based on file type
  let fillColor = '#9CA3AF'
  if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) fillColor = '#EAB308'
  else if (['.json', '.xml', '.yaml', '.yml'].includes(extension)) fillColor = '#F97316'
  else if (['.html', '.htm'].includes(extension)) fillColor = '#EF4444'
  else if (['.css', '.scss', '.less'].includes(extension)) fillColor = '#3B82F6'
  else if (['.py'].includes(extension)) fillColor = '#22C55E'
  else if (['.md', '.txt', '.doc', '.docx'].includes(extension)) fillColor = '#9CA3AF'
  else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(extension)) fillColor = '#EC4899'
  else if (['.mp3', '.wav', '.m4a'].includes(extension)) fillColor = '#A855F7'
  else if (['.mp4', '.mov', '.avi', '.mkv'].includes(extension)) fillColor = '#6366F1'
  else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) fillColor = '#EA580C'
  else if (['.pdf'].includes(extension)) fillColor = '#DC2626'

  return (
    <svg className="w-[20px] h-[20px]" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 3C5 2.44772 5.44772 2 6 2H11L15 6V17C15 17.5523 14.5523 18 14 18H6C5.44772 18 5 17.5523 5 17V3Z"
        fill={fillColor}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="0.5"
      />
      <path d="M11 2V6H15" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}

const PinIcon = () => (
  <svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
)

export default function FileRow({
  file,
  isSelected,
  isPinned,
  isRenaming,
  onSelect,
  onOpen,
  onContextMenu,
  onRename,
  onCancelRename,
  formatSize,
  formatDate,
  gridClass
}: FileRowProps) {
  const [editName, setEditName] = useState(file.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      // Use setTimeout to avoid synchronous state update warning and ensure input is ready
      const timer = setTimeout(() => {
        setEditName(file.name)
        if (inputRef.current) {
          inputRef.current.focus()
          // Select filename without extension
          const dotIndex = file.name.lastIndexOf('.')
          if (dotIndex > 0 && !file.isDirectory) {
            inputRef.current.setSelectionRange(0, dotIndex)
          } else {
            inputRef.current.select()
          }
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isRenaming, file.name, file.isDirectory])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editName.trim() && editName !== file.name) {
        onRename(file.path, editName.trim())
      } else {
        onCancelRename()
      }
    } else if (e.key === 'Escape') {
      setEditName(file.name)
      onCancelRename()
    }
  }

  const handleBlur = () => {
    if (editName.trim() && editName !== file.name) {
      onRename(file.path, editName.trim())
    } else {
      onCancelRename()
    }
  }

  return (
    <div
      className={`
        relative group cursor-default select-none py-[7px] transition-all duration-75 w-full
        ${gridClass || 'flex items-center gap-4 px-4'}
        ${isSelected
          ? 'bg-[#0A84FF] text-white rounded-md'
          : 'hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 rounded-md'
        }
      `}
      onClick={(e) => onSelect(file, e.metaKey || e.ctrlKey)}
      onDoubleClick={() => onOpen(file)}
      onContextMenu={(e) => onContextMenu(e, file)}
    >
      {/* Name column */}
      <div className="flex items-center gap-2.5 overflow-hidden min-w-0 w-full">
        <div className="flex-shrink-0">
          {file.isDirectory ? <FolderIcon /> : <FileIcon extension={file.extension} />}
        </div>

        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-[50px] px-2 py-1 text-[13px] bg-white dark:bg-[#2a2a2a] text-neutral-900 dark:text-white border border-[#0A84FF] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
          />
        ) : (
          <span className="truncate text-[13px] font-medium">{file.name}</span>
        )}

        {isPinned && !isRenaming && (
          <span className="flex-shrink-0 ml-1">
            <PinIcon />
          </span>
        )}
      </div>

      {/* Date column */}
      <div className={`text-[13px] truncate tabular-nums ${isSelected ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-500'}`}>
        {formatDate(file.modifiedTime)}
      </div>

      {/* Size column */}
      <div className={`text-[13px] text-right tabular-nums ${isSelected ? 'text-white/80' : 'text-neutral-400 dark:text-neutral-500'}`}>
        {file.isDirectory ? '--' : formatSize(file.size)}
      </div>

      {/* Kind column */}
      <div className={`text-[13px] truncate ${isSelected ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-500'}`}>
        {file.kind}
      </div>
    </div>
  )
}
