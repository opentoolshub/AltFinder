import { useEffect, useRef } from 'react'
import { FileInfo } from '../types'

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
  onNewFolder: () => void
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
  onNewFolder
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
        { label: isPinned ? 'Unpin' : 'Pin to Top', action: onPin },
        { label: '', action: () => {}, divider: true },
        { label: 'Copy', shortcut: 'Cmd+C', action: onCopy },
        { label: 'Cut', shortcut: 'Cmd+X', action: onCut },
        { label: 'Paste', shortcut: 'Cmd+V', action: onPaste, disabled: !hasClipboard },
        { label: '', action: () => {}, divider: true },
        { label: 'Rename', action: onRename },
        { label: 'Move to Trash', shortcut: 'Cmd+Del', action: onDelete },
        { label: '', action: () => {}, divider: true },
        { label: 'Show in Finder', action: onShowInFinder },
      ]
    : [
        { label: 'New Folder', shortcut: 'Cmd+Shift+N', action: onNewFolder },
        { label: '', action: () => {}, divider: true },
        { label: 'Paste', shortcut: 'Cmd+V', action: onPaste, disabled: !hasClipboard },
      ]

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] py-1 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              className="my-1 border-t border-neutral-200 dark:border-neutral-700"
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
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between
              ${item.disabled
                ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-blue-500 hover:text-white'
              }`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className={`ml-4 text-xs ${item.disabled ? '' : 'opacity-60'}`}>
                {item.shortcut}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
