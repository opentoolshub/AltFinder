import { useEffect, useRef } from 'react'

interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedTime: number
  createdTime: number
  kind: string
  extension: string
}

interface ContextMenuProps {
  x: number
  y: number
  file: FileInfo | null
  isPinned: boolean
  hasClipboard: boolean
  onClose: () => void
  onOpen: () => void
  onPin: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onDelete: () => void
  onRename: () => void
  onShowInFinder: () => void
  onShowInAltFinder: () => void
  onNewFolder: () => void
  onCopyPath: () => void
  onOpenTerminal: () => void
}

interface MenuItem {
  label: string
  shortcut?: string
  action: () => void
  disabled?: boolean
  divider?: boolean
}

export default function ContextMenu({
  x,
  y,
  file,
  isPinned,
  hasClipboard,
  onClose,
  onOpen,
  onPin,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRename,
  onShowInFinder,
  onShowInAltFinder,
  onNewFolder,
  onCopyPath,
  onOpenTerminal
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (x + rect.width > vw) {
        adjustedX = vw - rect.width - 8
      }
      if (y + rect.height > vh) {
        adjustedY = vh - rect.height - 8
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [x, y])

  const items: MenuItem[] = file
    ? [
        { label: 'Open', action: onOpen },
        { label: 'Open in Terminal', action: onOpenTerminal },
        { label: isPinned ? 'Unpin' : 'Pin to Top', action: onPin },
        { label: '', action: () => {}, divider: true },
        { label: 'Copy', shortcut: 'Cmd+C', action: onCopy },
        { label: 'Cut', shortcut: 'Cmd+X', action: onCut },
        { label: 'Paste', shortcut: 'Cmd+V', action: onPaste, disabled: !hasClipboard },
        { label: 'Copy Path', action: onCopyPath },
        { label: '', action: () => {}, divider: true },
        { label: 'Rename', action: onRename },
        { label: 'Move to Trash', shortcut: 'Cmd+Del', action: onDelete },
        { label: '', action: () => {}, divider: true },
        { label: 'Reveal in AltFinder', action: onShowInAltFinder },
        { label: 'Reveal in Finder', action: onShowInFinder },
      ]
    : [
        { label: 'New Folder', shortcut: 'Cmd+Shift+N', action: onNewFolder },
        { label: 'Open Terminal Here', action: onOpenTerminal },
        { label: '', action: () => {}, divider: true },
        { label: 'Paste', shortcut: 'Cmd+V', action: onPaste, disabled: !hasClipboard },
        { label: 'Copy Current Path', action: onCopyPath },
      ]

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] py-1 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-neutral-200/50 dark:border-white/10"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              className="my-1 mx-2 border-t border-neutral-200/60 dark:border-white/10"
            />
          )
        }

        return (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.action()
              }
            }}
            disabled={item.disabled}
            className={`w-full px-3 py-[6px] mx-1 text-left text-[13px] flex items-center justify-between transition-all duration-75 rounded-md
              ${item.disabled
                ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                : 'text-neutral-800 dark:text-neutral-200 hover:bg-[#0A84FF] hover:text-white'
              }`}
            style={{ width: 'calc(100% - 8px)' }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className={`ml-4 text-[11px] tabular-nums ${item.disabled ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-400 dark:text-neutral-500'}`}>
                {item.shortcut}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
