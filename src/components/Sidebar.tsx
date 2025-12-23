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
  <svg className="w-4 h-4 opacity-90" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="folderGradient" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path 
      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" 
      fill="url(#folderGradient)" 
      stroke="rgba(0,0,0,0.1)" 
      strokeWidth="0.5"
    />
  </svg>
)

const DiskIcon = () => (
  <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6ZM6 6H18V18H6V6ZM8 16C8.55228 16 9 15.5523 9 15C9 14.4477 8.55228 14 8 14C7.44772 14 7 14.4477 7 15C7 15.5523 7.44772 16 8 16ZM16 16C16.5523 16 17 15.5523 17 15C17 14.4477 16.5523 14 16 14C15.4477 14 15 14.4477 15 15C15 15.5523 15.4477 16 16 16Z" opacity="0.9" />
  </svg>
)

const AirDropIcon = () => (
  <svg className="w-4 h-4 text-[#007AFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L12 22" strokeOpacity="0" /> {/* Spacer */}
    <path d="M7.5 12C7.5 12 9 14 12 14C15 14 16.5 12 16.5 12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 9.5C5.5 9.5 8 12.5 12 12.5C16 12.5 18.5 9.5 18.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 7C3.5 7 7 11 12 11C17 11 20.5 7 20.5 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21L12 16" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16L9.5 18.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16L14.5 18.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RecentsIcon = () => (
  <svg className="w-4 h-4 text-[#007AFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
     <circle cx="12" cy="12" r="9" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V12L16 14" />
  </svg>
)

const CloudIcon = () => (
  <svg className="w-4 h-4 text-[#007AFF]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.034C17.657 6.657 14.812 4 11.5 4C8.48 4 5.86 6.22 5.27 9.15C2.86 9.77 1 11.85 1 14.5C1 17.5376 3.46243 20 6.5 20H17.5V19Z" fillOpacity="0.8" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-4 h-4 text-[#007AFF]" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2H6ZM6 4H13V9H18V20H6V4Z" />
  </svg>
)

const SharedIcon = () => (
  <svg className="w-4 h-4 text-[#007AFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
     <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21" />
     <circle cx="9" cy="9" r="4" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M17 11.0001C19.2091 11.0001 21 12.7909 21 15.0001V17.0001" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M17 3.00012C19.2091 3.00012 21 4.79102 21 7.00012C21 7.84478 20.7381 8.62854 20.2882 9.27368" />
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