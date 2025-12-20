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
    <div className="flex items-center justify-between gap-4 px-3 py-2 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 -webkit-app-region-drag">
      {/* Navigation buttons - drag region excluded */}
      <div className="flex items-center gap-1 -webkit-app-region-no-drag">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-md transition-colors
            ${canGoBack
              ? 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
          title="Go Back (Cmd+[)"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className={`p-1.5 rounded-md transition-colors
            ${canGoForward
              ? 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
          title="Go Forward (Cmd+])"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Search bar - drag region excluded */}
      <div className="flex-1 max-w-xs -webkit-app-region-no-drag">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Spacer for traffic lights on right */}
      <div className="w-20" />
    </div>
  )
}
