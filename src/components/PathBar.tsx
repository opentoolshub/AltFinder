import { useState, useRef, useEffect } from 'react'

interface PathBarProps {
  path: string
  onNavigate: (path: string) => void
}

const ChevronRight = () => (
  <svg className="w-3 h-3 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const DiskIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="pathDiskGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#9CA3AF" />
        <stop offset="1" stopColor="#6B7280" />
      </linearGradient>
    </defs>
    <rect x="3" y="5" width="14" height="10" rx="1.5" fill="url(#pathDiskGradient)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
    <rect x="5" y="7" width="6" height="1.5" rx="0.5" fill="rgba(255,255,255,0.3)" />
    <circle cx="13" cy="11" r="1.5" fill="rgba(255,255,255,0.2)" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

export default function PathBar({ path, onNavigate }: PathBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(path)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(path)
  }, [path])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  if (!path) return null

  const segments = path.split('/').filter(Boolean)
  const pathSegments = segments.map((segment, index) => ({
    name: segment,
    path: '/' + segments.slice(0, index + 1).join('/')
  }))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmed = editValue.trim()
      if (trimmed && trimmed !== path) {
        onNavigate(trimmed)
      }
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      setEditValue(path)
      setIsEditing(false)
    }
  }

  const handleCopyPath = (pathToCopy: string) => {
    window.electron.writeTextToClipboard(pathToCopy)
    setContextMenu(null)
  }

  const handleContextMenu = (e: React.MouseEvent, segmentPath: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, path: segmentPath })
  }

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== path) {
      onNavigate(trimmed)
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/5">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          className="flex-1 px-2 py-1 text-[13px] bg-white dark:bg-[#2a2a2a] text-neutral-900 dark:text-white border border-[#0A84FF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
          placeholder="Enter path..."
        />
        <button
          onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
          onClick={commitEdit}
          className="px-3 py-1 text-[12px] font-medium bg-[#0A84FF] text-white rounded-md hover:bg-[#0077ED] transition-colors"
        >
          Go
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
          onClick={() => {
            setEditValue(path)
            setIsEditing(false)
          }}
          className="px-3 py-1 text-[12px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1 px-4 py-2 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/5 text-[13px] overflow-x-auto no-scrollbar group">
        {/* Root */}
        <button
          onClick={() => onNavigate('/')}
          onContextMenu={(e) => handleContextMenu(e, '/')}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0 transition-colors"
          title="Macintosh HD"
        >
          <DiskIcon />
        </button>

        {pathSegments.map((segment, index) => (
          <div key={segment.path} className="flex items-center gap-1 flex-shrink-0">
            <ChevronRight />
            <button
              onClick={() => onNavigate(segment.path)}
              onContextMenu={(e) => handleContextMenu(e, segment.path)}
              className={`px-2 py-1 rounded-md transition-all duration-100 truncate max-w-[180px]
                ${index === pathSegments.length - 1
                  ? 'bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              title={segment.name}
            >
              {segment.name}
            </button>
          </div>
        ))}

        {/* Spacer that can be clicked to enter edit mode */}
        <div
          className="flex-1 min-w-[40px] h-6 cursor-text"
          onClick={() => setIsEditing(true)}
          title="Click to edit path"
        />

        {/* Copy and edit buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleCopyPath(path)}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            title="Copy path"
          >
            <CopyIcon />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            title="Edit path"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Context menu for copying path */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] py-1 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-neutral-200/50 dark:border-white/10"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleCopyPath(contextMenu.path)}
            className="w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center gap-2 transition-all duration-75 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white"
            style={{ width: 'calc(100% - 8px)' }}
          >
            <CopyIcon />
            Copy Path
          </button>
        </div>
      )}
    </>
  )
}
