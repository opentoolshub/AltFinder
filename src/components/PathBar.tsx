import { useState, useRef, useEffect, useCallback } from 'react'

interface PathBarProps {
  path: string
  homePath: string
  onNavigate: (path: string) => void
  onOpenInFinder?: (path: string) => void
  onOpenInTerminal?: (path: string) => void
}

interface Suggestion {
  name: string
  path: string
  isDirectory: boolean
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

export default function PathBar({ path, homePath, onNavigate, onOpenInFinder, onOpenInTerminal }: PathBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(path)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Expand ~ to home directory and handle common shell patterns
  const expandPath = useCallback((inputPath: string): string => {
    let expanded = inputPath.trim()

    // Expand ~ at the start
    if (expanded === '~') {
      return homePath
    }
    if (expanded.startsWith('~/')) {
      expanded = homePath + expanded.slice(1)
    }

    return expanded
  }, [homePath])

  // Get parent directory and partial name for autocomplete
  const getPathParts = useCallback((inputPath: string): { parentDir: string; partial: string } => {
    const expanded = expandPath(inputPath)
    const lastSlash = expanded.lastIndexOf('/')

    if (lastSlash === -1) {
      return { parentDir: '/', partial: expanded }
    }

    // If path ends with /, we're looking in that directory
    if (expanded.endsWith('/')) {
      return { parentDir: expanded.slice(0, -1) || '/', partial: '' }
    }

    return {
      parentDir: expanded.slice(0, lastSlash) || '/',
      partial: expanded.slice(lastSlash + 1)
    }
  }, [expandPath])

  // Fetch suggestions based on current input
  const fetchSuggestions = useCallback(async (inputPath: string) => {
    if (!inputPath) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const { parentDir, partial } = getPathParts(inputPath)

    try {
      // Check if parent directory exists
      const exists = await window.electron.exists(parentDir)
      if (!exists) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Get directory contents
      const files = await window.electron.readDirectoryFast(parentDir, true, 100)

      // Filter to matching items (prefer directories)
      const filtered = files.files
        .filter(f => f.name.toLowerCase().startsWith(partial.toLowerCase()))
        .sort((a, b) => {
          // Directories first
          if (a.isDirectory && !b.isDirectory) return -1
          if (!a.isDirectory && b.isDirectory) return 1
          return a.name.localeCompare(b.name)
        })
        .slice(0, 8)
        .map(f => ({
          name: f.name,
          path: f.path,
          isDirectory: f.isDirectory
        }))

      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedIndex(-1)
    } catch {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [getPathParts])

  // Debounce suggestion fetching
  useEffect(() => {
    if (!isEditing) return

    const timer = setTimeout(() => {
      fetchSuggestions(editValue)
    }, 100)

    return () => clearTimeout(timer)
  }, [editValue, isEditing, fetchSuggestions])

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

  // Apply a suggestion
  const applySuggestion = (suggestion: Suggestion) => {
    const newValue = suggestion.isDirectory ? suggestion.path + '/' : suggestion.path
    setEditValue(newValue)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      // Tab completes with the first/selected suggestion
      const suggestion = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0]
      applySuggestion(suggestion)
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      if (showSuggestions && selectedIndex >= 0) {
        e.preventDefault()
        applySuggestion(suggestions[selectedIndex])
      } else {
        const expanded = expandPath(editValue)
        if (expanded && expanded !== path) {
          onNavigate(expanded)
        }
        setIsEditing(false)
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false)
      } else {
        setEditValue(path)
        setIsEditing(false)
      }
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
    const expanded = expandPath(editValue)
    if (expanded && expanded !== path) {
      onNavigate(expanded)
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="relative flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/5">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => {
                if (!suggestionsRef.current?.contains(document.activeElement)) {
                  commitEdit()
                  setShowSuggestions(false)
                }
              }, 150)
            }}
            className="w-full px-2 py-1 text-[13px] bg-white dark:bg-[#2a2a2a] text-neutral-900 dark:text-white border border-[#0A84FF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
            placeholder="Enter path... (Tab to autocomplete)"
          />

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-1 z-50 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-2xl rounded-lg shadow-2xl border border-neutral-200/50 dark:border-white/10 overflow-hidden"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.path}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(suggestion)}
                  className={`w-full px-3 py-1.5 text-left text-[13px] flex items-center gap-2 transition-colors
                    ${index === selectedIndex
                      ? 'bg-[#0A84FF] text-white'
                      : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10'
                    }`}
                >
                  {suggestion.isDirectory ? (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  )}
                  <span className="truncate">{suggestion.name}</span>
                  {suggestion.isDirectory && (
                    <span className="ml-auto text-[11px] opacity-50">/</span>
                  )}
                </button>
              ))}
              <div className="px-3 py-1 text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-200/50 dark:border-white/10">
                Tab to complete • ↑↓ to navigate • Enter to select
              </div>
            </div>
          )}
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={commitEdit}
          className="px-3 py-1 text-[12px] font-medium bg-[#0A84FF] text-white rounded-md hover:bg-[#0077ED] transition-colors"
        >
          Go
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setEditValue(path)
            setIsEditing(false)
            setShowSuggestions(false)
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

      {/* Context menu for path segments */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] py-1 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-neutral-200/50 dark:border-white/10"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              onNavigate(contextMenu.path)
              setContextMenu(null)
            }}
            className="w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center gap-2 transition-all duration-75 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white"
            style={{ width: 'calc(100% - 8px)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Open in AltFinder
          </button>
          {onOpenInFinder && (
            <button
              onClick={() => {
                onOpenInFinder(contextMenu.path)
                setContextMenu(null)
              }}
              className="w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center gap-2 transition-all duration-75 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white"
              style={{ width: 'calc(100% - 8px)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Show in Finder
            </button>
          )}
          {onOpenInTerminal && (
            <button
              onClick={() => {
                onOpenInTerminal(contextMenu.path)
                setContextMenu(null)
              }}
              className="w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center gap-2 transition-all duration-75 rounded-md text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white"
              style={{ width: 'calc(100% - 8px)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Open in Terminal
            </button>
          )}
          <div className="my-1 mx-2 border-t border-neutral-200/60 dark:border-white/10" />
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
