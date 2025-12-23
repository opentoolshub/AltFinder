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
  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
)

export default function Sidebar({ favorites = [], currentPath, onNavigate, loading }: SidebarProps) {
  if (loading || !favorites) {
    return (
      <div className="w-56 bg-neutral-100/60 dark:bg-neutral-900/30 border-r border-neutral-200/80 dark:border-white/10 pt-10 backdrop-blur-sm">
        <div className="h-11 w-full drag-region flex-shrink-0" />
        <div className="px-4 py-2 text-xs text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-56 bg-neutral-100/60 dark:bg-neutral-900/30 border-r border-neutral-200/80 dark:border-white/10 flex-shrink-0 flex flex-col backdrop-blur-sm">
      {/* Draggable top area for traffic lights */}
      <div className="h-12 w-full drag-region flex-shrink-0" />
      
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        <div>
          <h3 className="px-3 mb-1 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest select-none">
            Favorites
          </h3>
          <ul className="space-y-0.5">
            {favorites.map((favorite) => {
              const isActive = currentPath === favorite.path

              return (
                <li key={favorite.path}>
                  <button
                    onClick={() => onNavigate(favorite.path)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-100
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm font-medium'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20'
                      }`}
                    title={favorite.path}
                  >
                    <span className={isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400 opacity-80'}>
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
    </div>
  )
}
