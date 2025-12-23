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

export default function PathBar({ path, onNavigate }: PathBarProps) {
  if (!path) return null

  const segments = path.split('/').filter(Boolean)

  // Build paths for each segment
  const pathSegments = segments.map((segment, index) => ({
    name: segment,
    path: '/' + segments.slice(0, index + 1).join('/')
  }))

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/5 text-[13px] overflow-x-auto no-scrollbar">
      {/* Root */}
      <button
        onClick={() => onNavigate('/')}
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
    </div>
  )
}
