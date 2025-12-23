interface FinderFavorite {
  name: string
  path: string
}

interface SidebarProps {
  favorites: FinderFavorite[]
  currentPath: string
  onNavigate: (path: string) => void
  loading: boolean
  homePath: string
}

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
)

const AirDropIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 16l-4-4h8l-4 4zm0-12v8" /> 
    {/* Simplified AirDrop-ish icon */}
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l4 4 4-4" />
    <path d="M12 8v8" />
  </svg>
)

const RecentsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CloudIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SharedIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const DiskIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

export default function Sidebar({ favorites = [], currentPath, onNavigate, loading, homePath }: SidebarProps) {
  if (loading || !favorites) {
    return (
      <div className="w-60 bg-neutral-100 dark:bg-[#1e1e1e] border-r border-neutral-200 dark:border-[#333] pt-10 flex-shrink-0">
        <div className="h-11 w-full drag-region flex-shrink-0" />
        <div className="px-5 py-2 text-xs text-neutral-400">Loading...</div>
      </div>
    )
  }

  // Define sections
  const specialFavorites = [
    { name: 'AirDrop', path: `${homePath}/Downloads`, icon: AirDropIcon, special: true }, // Mapped to Downloads for now
    { name: 'Recents', path: homePath, icon: RecentsIcon, special: true }, // Mapped to Home for now
  ]

  const iCloudItems = [
    { name: 'iCloud Drive', path: `${homePath}/Library/Mobile Documents/com~apple~CloudDocs`, icon: CloudIcon },
    { name: 'Documents', path: `${homePath}/Documents`, icon: DocumentIcon },
    { name: 'Shared', path: `/Users/Shared`, icon: SharedIcon },
  ]

  const locationItems = [
    { name: 'Macintosh HD', path: '/', icon: DiskIcon }
  ]

  // Filter out duplicates from system favorites if we are hardcoding them
  // (e.g. if user has Documents in favorites, we might want to keep it there or dedupe)
  // For now, we'll dedupe common names to avoid confusion
  const cleanFavorites = favorites.filter(f => 
    !['iCloud Drive', 'Documents', 'Macintosh HD', 'Recents', 'AirDrop'].includes(f.name)
  )

  const renderSection = (title: string, items: { name: string; path: string; icon: any }[]) => (
    <div>
      <h3 className="px-3 mb-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide select-none group flex items-center justify-between">
        <span>{title}</span>
        {/* Simplified disclosure indicator */}
      </h3>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = currentPath === item.path

          return (
            <li key={item.path}>
              <button
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-75 group
                  ${isActive
                    ? 'bg-neutral-300/50 dark:bg-white/10 text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-white/5'
                  }`}
                title={item.path}
              >
                <span className={`transition-colors ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400'}`}>
                  <item.icon />
                </span>
                <span className="truncate">{item.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <div className="w-60 bg-neutral-100/90 dark:bg-[#1e1e1e]/90 border-r border-neutral-200 dark:border-[#333] flex-shrink-0 flex flex-col backdrop-blur-xl">
      {/* Draggable top area for traffic lights */}
      <div className="h-10 w-full drag-region flex-shrink-0" />
      
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6">
        
        {/* Favorites Section */}
        <div>
          <h3 className="px-3 mb-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide select-none">
            Favorites
          </h3>
          <ul className="space-y-0.5">
            {/* Special Items */}
            {specialFavorites.map((item) => (
               <li key={item.name}>
               <button
                 onClick={() => onNavigate(item.path)}
                 className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-75 group
                   ${currentPath === item.path
                     ? 'bg-neutral-300/50 dark:bg-white/10 text-neutral-900 dark:text-white font-medium'
                     : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-white/5'
                   }`}
               >
                 <span className="text-blue-500 dark:text-blue-400">
                   <item.icon />
                 </span>
                 <span className="truncate">{item.name}</span>
               </button>
             </li>
            ))}
            
            {/* System Favorites */}
            {cleanFavorites.map((favorite) => {
              const isActive = currentPath === favorite.path

              return (
                <li key={favorite.path}>
                  <button
                    onClick={() => onNavigate(favorite.path)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-75 group
                      ${isActive
                        ? 'bg-neutral-300/50 dark:bg-white/10 text-neutral-900 dark:text-white font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-white/5'
                      }`}
                    title={favorite.path}
                  >
                    <span className={`transition-colors ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400'}`}>
                      <FolderIcon />
                    </span>
                    <span className="truncate">{favorite.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* iCloud Section */}
        {renderSection('iCloud', iCloudItems)}

        {/* Locations Section */}
        {renderSection('Locations', locationItems)}

      </div>
    </div>
  )
}