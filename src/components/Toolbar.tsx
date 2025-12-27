import { forwardRef } from 'react'

interface ToolbarProps {
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  showHiddenFiles: boolean
  onToggleHiddenFiles: () => void
}

const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeSlashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

const Toolbar = forwardRef<HTMLInputElement, ToolbarProps>(function Toolbar({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  searchQuery,
  onSearchChange,
  showHiddenFiles,
  onToggleHiddenFiles
}, ref) {
  return (
    <div className="h-12 flex items-center justify-between gap-4 px-4 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/5 drag-region">
      {/* Navigation buttons - drag region excluded */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-md transition-all duration-100
            ${canGoBack
              ? 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 active:bg-black/10 dark:active:bg-white/15'
              : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
            }`}
          title="Go Back (Cmd+[)"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className={`p-1.5 rounded-md transition-all duration-100
            ${canGoForward
              ? 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 active:bg-black/10 dark:active:bg-white/15'
              : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
            }`}
          title="Go Forward (Cmd+])"
        >
          <ChevronRight />
        </button>

        <div className="w-px h-5 bg-neutral-200 dark:bg-white/10 mx-1" />

        <button
          onClick={onToggleHiddenFiles}
          className={`p-1.5 rounded-md transition-all duration-100
            ${showHiddenFiles
              ? 'bg-[#0A84FF]/10 text-[#0A84FF] hover:bg-[#0A84FF]/20'
              : 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 dark:text-neutral-500'
            }`}
          title={`${showHiddenFiles ? 'Hide' : 'Show'} Hidden Files (Cmd+Shift+.)`}
        >
          {showHiddenFiles ? <EyeIcon /> : <EyeSlashIcon />}
        </button>
      </div>

      {/* Search bar - drag region excluded */}
      <div className="flex-1 max-w-xs no-drag">
        <div className="relative group">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-[#0A84FF] transition-colors pointer-events-none">
            <SearchIcon />
          </span>
          <input
            ref={ref}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-neutral-100/80 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-white/10 focus:border-[#0A84FF]/50 dark:focus:border-[#0A84FF]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-neutral-400 dark:placeholder-neutral-500"
          />
        </div>
      </div>
    </div>
  )
})

export default Toolbar
