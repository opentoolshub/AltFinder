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
  <svg className="w-[18px] h-[18px] drop-shadow-sm" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="folderGradientRow" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path 
      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" 
      fill="url(#folderGradientRow)"
      stroke="rgba(0,0,0,0.1)" 
      strokeWidth="0.5"
    />
  </svg>
)

const FileIcon = ({ extension }: { extension: string }) => {
  // Color based on file type
  let color = 'text-neutral-400'
  if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) color = 'text-[#F1C40F]'
  else if (['.json', '.xml', '.yaml', '.yml'].includes(extension)) color = 'text-[#E67E22]'
  else if (['.html', '.htm'].includes(extension)) color = 'text-[#E74C3C]'
  else if (['.css', '.scss', '.less'].includes(extension)) color = 'text-[#3498DB]'
  else if (['.py'].includes(extension)) color = 'text-[#2ECC71]'
  else if (['.md', '.txt', '.doc', '.docx'].includes(extension)) color = 'text-neutral-400'
  else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(extension)) color = 'text-[#E91E63]'
  else if (['.mp3', '.wav', '.m4a'].includes(extension)) color = 'text-[#9B59B6]'
  else if (['.mp4', '.mov', '.avi', '.mkv'].includes(extension)) color = 'text-[#3F51B5]'
  else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) color = 'text-[#D35400]'
  else if (['.pdf'].includes(extension)) color = 'text-[#C0392B]'

  return (
    <svg className={`w-[18px] h-[18px] ${color} fill-current drop-shadow-sm`} viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  )
}

const PinIcon = () => (
  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
    <path d="M10 10.5a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5z" />
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
        relative group cursor-default select-none py-1.5 transition-colors duration-75 w-full
        ${gridClass || 'flex items-center gap-4 px-4'}
        ${isSelected
          ? 'bg-blue-600 text-white shadow-sm'
          : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 odd:bg-transparent even:bg-neutral-50/30 dark:even:bg-white/[0.02]'
        }
        ${isSelected ? 'rounded-md' : 'rounded-md'}
      `}
      onClick={(e) => onSelect(file, e.metaKey || e.ctrlKey)}
      onDoubleClick={() => onOpen(file)}
      onContextMenu={(e) => onContextMenu(e, file)}
    >
      {/* Name column */}
      <div className="flex items-center gap-3 overflow-hidden min-w-0 w-full pl-1">
        <div className="flex-shrink-0 opacity-90">
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
            className="flex-1 min-w-[50px] px-1.5 py-0.5 text-sm bg-white dark:bg-[#252525] text-neutral-900 dark:text-white border border-blue-500 rounded shadow-sm focus:outline-none"
          />
        ) : (
          <span className="truncate text-[13px] font-medium leading-tight">{file.name}</span>
        )}

        {isPinned && !isRenaming && <PinIcon />}
      </div>

      {/* Date column */}
      <div className={`text-[13px] truncate ${isSelected ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-500'}`}>
        {formatDate(file.modifiedTime)}
      </div>

      {/* Size column */}
      <div className={`text-[13px] text-right font-mono opacity-80 ${isSelected ? 'text-blue-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
        {file.isDirectory ? '--' : formatSize(file.size)}
      </div>

      {/* Kind column */}
      <div className={`text-[13px] truncate ${isSelected ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-500'}`}>
        {file.kind}
      </div>
    </div>
  )
}
