interface ToolbarProps {
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
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

export default function Toolbar({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  searchQuery,
  onSearchChange
}: ToolbarProps) {
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
      </div>

      {/* Search bar - drag region excluded */}
      <div className="flex-1 max-w-xs no-drag">
        <div className="relative group">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-focus-within:text-[#0A84FF] transition-colors pointer-events-none">
            <SearchIcon />
          </span>
          <input
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
}
