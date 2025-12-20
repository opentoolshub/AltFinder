interface FinderFavorite {
  name: string
  path: string
}

interface SidebarProps {
  favorites: FinderFavorite[]
  currentPath: string
  onNavigate: (path: string) => void
  loading: boolean
}

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
)

export default function Sidebar({ favorites = [], currentPath, onNavigate, loading }: SidebarProps) {
  if (loading || !favorites) {
    return (
      <div className="w-48 bg-neutral-100/80 dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700 pt-10">
        <div className="px-4 py-2 text-xs text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-48 bg-neutral-100/80 dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700 pt-10 flex-shrink-0 overflow-y-auto">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          Favorites
        </h3>
        <ul className="space-y-0.5">
          {favorites.map((favorite) => {
            const isActive = currentPath === favorite.path

            return (
              <li key={favorite.path}>
                <button
                  onClick={() => onNavigate(favorite.path)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors
                    ${isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  title={favorite.path}
                >
                  <span className={isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}>
                    <FolderIcon />
                  </span>
                  <span className="truncate">{favorite.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
