import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'

import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import NotificationItem from '../components/live/NotificationItem'
import { useNotifications } from '../components/live/liveEventsContext'
import { useToast } from '../components/common/feedbackContext'
import { getNotifications } from '../services/notificationService'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
]

/*
 * Every notification, newest first. The list is loaded from the
 * API; new ones arriving live are merged in from the shared
 * live connection (the same one the header bell uses).
 */
function Notifications() {
  const toast = useToast()
  const { notifications: latest, unreadCount, markRead, markAllRead } = useNotifications()

  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)

    getNotifications({ unread: filter === 'unread', limit: 200 })
      .then((result) => {
        if (!ignore) setItems(result.data)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [filter])

  // Merge in what the live connection knows: new arrivals and
  // read/unread changes made from the bell or another tab.
  const latestById = new Map(latest.map((item) => [item._id, item]))
  const known = new Set(items.map((item) => item._id))
  const merged = [
    ...latest.filter((item) => !known.has(item._id)),
    ...items.map((item) => {
      const fresh = latestById.get(item._id)
      const read = fresh ? fresh.read : item.read || unreadCount === 0
      return { ...item, read }
    }),
  ]
  const visible = filter === 'unread' ? merged.filter((item) => !item.read) : merged

  const openItem = (notification) => {
    if (notification.read) return
    setItems((current) =>
      current.map((item) => (item._id === notification._id ? { ...item, read: true } : item)),
    )
    markRead(notification._id).catch((err) => toast.error(err.message))
  }

  const handleMarkAll = async () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })))
    try {
      await markAllRead()
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread · updates live as things happen`
            : 'You’re all caught up · updates live as things happen'
        }
        action={
          <Button
            variant="secondary"
            icon={<CheckCheck size={16} aria-hidden="true" />}
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        }
      />

      <div className="notif-filters" role="group" aria-label="Show">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="notif-filter"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
            {option.value === 'unread' && unreadCount > 0 && (
              <span className="notif-filter-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="notif-error" role="alert">{error}</p>}

      {loading ? (
        <p className="notif-empty">Loading notifications…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} aria-hidden="true" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="Leave requests, approvals, new hires and other important changes will show up here."
        />
      ) : (
        <ul className="notif-list notif-list-page">
          {visible.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} onOpen={openItem} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default Notifications
