interface ToolbarProps {
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export default function Toolbar({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  searchQuery,
  onSearchChange
}: ToolbarProps) {
  return (
    <div className="h-14 flex items-center justify-between gap-4 px-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-[#333] drag-region">
      {/* Navigation buttons - drag region excluded */}
      <div className="flex items-center gap-2 no-drag">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`p-2 rounded-lg transition-colors
            ${canGoBack
              ? 'hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
            }`}
          title="Go Back (Cmd+[)"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className={`p-2 rounded-lg transition-colors
            ${canGoForward
              ? 'hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
            }`}
          title="Go Forward (Cmd+])"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Search bar - drag region excluded */}
      <div className="flex-1 max-w-xs no-drag">
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-neutral-600 dark:group-focus-within:text-neutral-300 transition-colors pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-neutral-100 dark:bg-[#1e1e1e] border border-transparent focus:bg-white dark:focus:bg-[#252525] focus:border-neutral-300 dark:focus:border-[#444] rounded-lg focus:outline-none focus:shadow-sm transition-all placeholder-neutral-400"
          />
        </div>
      </div>
    </div>
  )
}
