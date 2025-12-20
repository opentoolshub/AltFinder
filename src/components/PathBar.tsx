interface PathBarProps {
  path: string
  onNavigate: (path: string) => void
}

export default function PathBar({ path, onNavigate }: PathBarProps) {
  if (!path) return null

  const segments = path.split('/').filter(Boolean)

  // Build paths for each segment
  const pathSegments = segments.map((segment, index) => ({
    name: segment,
    path: '/' + segments.slice(0, index + 1).join('/')
  }))

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 text-sm overflow-x-auto">
      {/* Root */}
      <button
        onClick={() => onNavigate('/')}
        className="px-1.5 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 flex-shrink-0"
      >
        /
      </button>

      {pathSegments.map((segment, index) => (
        <div key={segment.path} className="flex items-center gap-1 flex-shrink-0">
          <span className="text-neutral-400 dark:text-neutral-600">/</span>
          <button
            onClick={() => onNavigate(segment.path)}
            className={`px-1.5 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 truncate max-w-[150px]
              ${index === pathSegments.length - 1
                ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-600 dark:text-neutral-400'
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
