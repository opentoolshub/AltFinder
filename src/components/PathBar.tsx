interface PathBarProps {
  path: string
  onNavigate: (path: string) => void
}

const ChevronRight = () => (
  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export default function PathBar({ path, onNavigate }: PathBarProps) {
  if (!path) return null

  const segments = path.split('/').filter(Boolean)

  // Build paths for each segment
  const pathSegments = segments.map((segment, index) => ({
    name: segment,
    path: '/' + segments.slice(0, index + 1).join('/')
  }))

  return (
    <div className="flex items-center gap-0.5 px-4 py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-[#333] text-[13px] overflow-x-auto no-scrollbar">
      {/* Root */}
      <button
        onClick={() => onNavigate('/')}
        className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex-shrink-0 transition-colors"
        title="Root"
      >
        <div className="w-4 h-4 border-2 border-current rounded-sm opacity-60" /> {/* Abstract HD icon */}
      </button>

      {pathSegments.map((segment, index) => (
        <div key={segment.path} className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-neutral-300 dark:text-neutral-600 px-0.5"><ChevronRight /></span>
          <button
            onClick={() => onNavigate(segment.path)}
            className={`px-2 py-1 rounded-md transition-colors truncate max-w-[200px]
              ${index === pathSegments.length - 1
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            title={segment.name}
          >
            {segment.name}
          </button>
        </div>
      ))}
    </div>
  )
}
