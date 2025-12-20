import { SpecialPaths } from '../types'

interface SidebarProps {
  specialPaths: SpecialPaths | null
  currentPath: string
  onNavigate: (path: string) => void
}

const FolderIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const DesktopIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const AppsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

interface LocationItem {
  key: keyof SpecialPaths
  name: string
  icon: React.ReactNode
}

const locations: LocationItem[] = [
  { key: 'home', name: 'Home', icon: <HomeIcon /> },
  { key: 'desktop', name: 'Desktop', icon: <DesktopIcon /> },
  { key: 'documents', name: 'Documents', icon: <DocumentIcon /> },
  { key: 'downloads', name: 'Downloads', icon: <DownloadIcon /> },
  { key: 'applications', name: 'Applications', icon: <AppsIcon /> },
]

export default function Sidebar({ specialPaths, currentPath, onNavigate }: SidebarProps) {
  if (!specialPaths) {
    return (
      <div className="w-48 bg-neutral-100/80 dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700 pt-10">
        <div className="px-4 py-2 text-xs text-neutral-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-48 bg-neutral-100/80 dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700 pt-10 flex-shrink-0">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          Favorites
        </h3>
        <ul className="space-y-0.5">
          {locations.map((location) => {
            const path = specialPaths[location.key]
            const isActive = currentPath === path

            return (
              <li key={location.key}>
                <button
                  onClick={() => onNavigate(path)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors
                    ${isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                >
                  <span className={isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}>
                    {location.icon}
                  </span>
                  {location.name}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
