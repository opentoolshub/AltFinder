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
  isAllPinnedView: boolean
  onShowAllPinned: () => void
}

const FolderIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="folderGradientSidebar" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path
      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      fill="url(#folderGradientSidebar)"
      stroke="rgba(0,0,0,0.1)"
      strokeWidth="0.5"
    />
  </svg>
)

const DiskIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="diskGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#9CA3AF" />
        <stop offset="1" stopColor="#6B7280" />
      </linearGradient>
    </defs>
    <rect x="2" y="4" width="16" height="12" rx="2" fill="url(#diskGradient)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
    <rect x="4" y="6" width="8" height="2" rx="0.5" fill="rgba(255,255,255,0.3)" />
    <circle cx="14" cy="12" r="2" fill="rgba(255,255,255,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
  </svg>
)

const AirDropIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="airdropGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path d="M6 9C6 9 7.5 11 10 11C12.5 11 14 9 14 9" stroke="url(#airdropGradient)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 7C4 7 6 10 10 10C14 10 16 7 16 7" stroke="url(#airdropGradient)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 5C2 5 5 9 10 9C15 9 18 5 18 5" stroke="url(#airdropGradient)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 18V13M10 13L7.5 15.5M10 13L12.5 15.5" stroke="url(#airdropGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RecentsIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="recentsGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <circle cx="10" cy="10" r="7.5" stroke="url(#recentsGradient)" strokeWidth="1.5" />
    <path d="M10 5.5V10L13 12" stroke="url(#recentsGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloudIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="cloudGradient" x1="10" y1="4" x2="10" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path d="M14.5 15H5.5C3.567 15 2 13.433 2 11.5C2 9.77 3.24 8.33 4.89 8.06C5.33 5.77 7.41 4 9.89 4C12.15 4 14.08 5.49 14.68 7.53C16.54 7.73 18 9.31 18 11.25C18 13.32 16.4 15 14.5 15Z" fill="url(#cloudGradient)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="docGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <path d="M5 3C5 2.44772 5.44772 2 6 2H11L15 6V17C15 17.5523 14.5523 18 14 18H6C5.44772 18 5 17.5523 5 17V3Z" fill="url(#docGradient)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
    <path d="M11 2V6H15" fill="rgba(255,255,255,0.3)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
  </svg>
)

const SharedIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="sharedGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5AC8FA" />
        <stop offset="1" stopColor="#007AFF" />
      </linearGradient>
    </defs>
    <circle cx="7" cy="7" r="3" stroke="url(#sharedGradient)" strokeWidth="1.5" />
    <path d="M2 17V15.5C2 13.567 3.567 12 5.5 12H8.5C10.433 12 12 13.567 12 15.5V17" stroke="url(#sharedGradient)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="14" cy="6" r="2.5" stroke="url(#sharedGradient)" strokeWidth="1.5" />
    <path d="M18 14V13C18 11.343 16.657 10 15 10H13.5" stroke="url(#sharedGradient)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const PinnedIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="pinnedGradient" x1="10" y1="2" x2="10" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FBBF24" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path d="M10 2L12.5 7.5H18L13.5 11.5L15.5 18L10 14L4.5 18L6.5 11.5L2 7.5H7.5L10 2Z" fill="url(#pinnedGradient)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
  </svg>
)

export default function Sidebar({ favorites = [], currentPath, onNavigate, loading, homePath, isAllPinnedView, onShowAllPinned }: SidebarProps) {

  if (loading || !favorites) {
    return (
      <div className="w-56 bg-neutral-100/60 dark:bg-[#1e1e1e]/50 border-r border-neutral-200/60 dark:border-white/5 pt-12 flex-shrink-0 backdrop-blur-xl">
        <div className="px-4 py-2 text-[13px] text-neutral-400">Loading...</div>
      </div>
    )
  }



  // Define sections

  const specialFavorites = [

    { name: 'AirDrop', path: `${homePath}/Downloads`, icon: AirDropIcon, special: true },

    { name: 'Recents', path: homePath, icon: RecentsIcon, special: true },

  ]



  const iCloudItems = [

    { name: 'iCloud Drive', path: `${homePath}/Library/Mobile Documents/com~apple~CloudDocs`, icon: CloudIcon },

    { name: 'Documents', path: `${homePath}/Documents`, icon: DocumentIcon },

    { name: 'Shared', path: `/Users/Shared`, icon: SharedIcon },

  ]



  const locationItems = [

    { name: 'Macintosh HD', path: '/', icon: DiskIcon }

  ]



  // Filter out duplicates

  const cleanFavorites = favorites.filter(f => 

    !['iCloud Drive', 'Documents', 'Macintosh HD', 'Recents', 'AirDrop'].includes(f.name)

  )



  const renderSection = (title: string, items: { name: string; path: string; icon: any }[]) => (
    <div className="mb-5">
      <h3 className="px-4 mb-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide select-none">
        {title}
      </h3>
      <ul className="space-y-px px-2">
        {items.map((item) => {
          const isActive = !isAllPinnedView && currentPath === item.path
          return (
            <li key={item.path}>
              <button
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all duration-100 group
                  ${isActive
                    ? 'bg-black/8 dark:bg-white/10 text-neutral-900 dark:text-white font-medium shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                title={item.path}
              >
                <span className="flex-shrink-0">
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
    <div className="w-56 bg-neutral-100/60 dark:bg-[#1e1e1e]/50 border-r border-neutral-200/60 dark:border-white/5 flex-shrink-0 flex flex-col backdrop-blur-xl">
      {/* Draggable top area for traffic lights */}
      <div className="h-12 w-full drag-region flex-shrink-0" />

      <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {/* Favorites Section */}
        <div className="mb-5">
          <h3 className="px-4 mb-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wide select-none">
            Favorites
          </h3>
          <ul className="space-y-px px-2">
            {/* All Pinned */}
            <li>
              <button
                onClick={onShowAllPinned}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all duration-100 group
                  ${isAllPinnedView
                    ? 'bg-black/8 dark:bg-white/10 text-neutral-900 dark:text-white font-medium shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <span className="flex-shrink-0">
                  <PinnedIcon />
                </span>
                <span className="truncate">All Pinned</span>
              </button>
            </li>

            {/* Special Items */}
            {specialFavorites.map((item) => {
              const isActive = !isAllPinnedView && currentPath === item.path
              return (
                <li key={item.name}>
                  <button
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all duration-100 group
                      ${isActive
                        ? 'bg-black/8 dark:bg-white/10 text-neutral-900 dark:text-white font-medium shadow-sm'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    <span className="flex-shrink-0">
                      <item.icon />
                    </span>
                    <span className="truncate">{item.name}</span>
                  </button>
                </li>
              )
            })}

            {/* System Favorites */}
            {cleanFavorites.map((favorite) => {
              const isActive = !isAllPinnedView && currentPath === favorite.path
              return (
                <li key={favorite.path}>
                  <button
                    onClick={() => onNavigate(favorite.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all duration-100 group
                      ${isActive
                        ? 'bg-black/8 dark:bg-white/10 text-neutral-900 dark:text-white font-medium shadow-sm'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    title={favorite.path}
                  >
                    <span className="flex-shrink-0">
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
