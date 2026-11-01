import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'

import NotificationItem from './NotificationItem'
import { useNotifications } from './liveEventsContext'

/*
 * Bell in the header: live unread count + the latest notifications.
 * Closes on Escape, on a click outside, or when an item is opened.
 */
function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const panelId = useId()
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointer = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false)
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  const openItem = (notification) => {
    if (!notification.read) markRead(notification._id).catch(() => {})
    setIsOpen(false)
  }

  const label =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'

  return (
    <div className="notif-bell" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        className="notif-bell-button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div id={panelId} className="notif-panel" role="region" aria-label="Latest notifications">
          <div className="notif-panel-header">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <button type="button" className="notif-text-button" onClick={() => markAllRead().catch(() => {})}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notif-empty">You're all caught up.</p>
          ) : (
            <ul className="notif-list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onOpen={openItem}
                />
              ))}
            </ul>
          )}

          <Link to="/notifications" className="notif-panel-footer" onClick={() => setIsOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
