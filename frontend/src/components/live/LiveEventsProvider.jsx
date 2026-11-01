import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { API_BASE, CLIENT_ID } from '../../services/apiClient'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService'
import { useToast } from '../common/feedbackContext'
import { LiveEventsContext } from './liveEventsContext'

const LATEST_COUNT = 8

/*
 * Opens ONE live connection (Server-Sent Events) for the whole app
 * and shares what arrives:
 *   - notifications + unread count (header bell, Notifications page)
 *   - activity events (dashboard feed, pages that refresh themselves)
 *
 * The browser's EventSource reconnects by itself if the server
 * restarts; after reconnecting we reload the notifications in case
 * some arrived while we were offline.
 */
function LiveEventsProvider({ children }) {
  const toast = useToast()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [status, setStatus] = useState('connecting') // connecting | live | offline

  const subscribersRef = useRef(new Set())

  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const loadLatest = useCallback(async () => {
    try {
      const result = await getNotifications({ limit: LATEST_COUNT })
      setNotifications(result.data)
      setUnreadCount(result.unreadCount)
    } catch {
      // The bell keeps what it has; pages show their own errors.
    }
  }, [])

  useEffect(() => {
    loadLatest()

    const source = new EventSource(`${API_BASE}/stream`)
    let hasConnected = false

    const read = (message) => {
      try {
        return JSON.parse(message.data)
      } catch {
        return null
      }
    }

    source.addEventListener('ready', () => {
      setStatus('live')
      if (hasConnected) loadLatest() // catch up after a reconnect
      hasConnected = true
    })

    source.addEventListener('activity', (message) => {
      const event = read(message)
      if (event) subscribersRef.current.forEach((callback) => callback(event))
    })

    source.addEventListener('notification', (message) => {
      const notification = read(message)
      if (!notification) return

      setNotifications((current) =>
        [notification, ...current.filter((item) => item._id !== notification._id)].slice(
          0,
          LATEST_COUNT,
        ),
      )
      setUnreadCount((count) => count + 1)

      // The tab that made the change has already shown "Saved".
      if (notification.clientId !== CLIENT_ID) {
        const show = notification.tone === 'success' ? toast.success : toast.info
        show(`${notification.title}: ${notification.message}`)
      }
    })

    source.addEventListener('notifications-read', (message) => {
      const data = read(message)
      if (!data) return

      setUnreadCount(data.unreadCount)
      if (data.unreadCount === 0) {
        setNotifications((current) => current.map((item) => ({ ...item, read: true })))
      }
    })

    source.onerror = () => setStatus('offline')

    return () => source.close()
  }, [loadLatest, toast])

  const markRead = useCallback(async (id) => {
    setNotifications((current) =>
      current.map((item) => (item._id === id ? { ...item, read: true } : item)),
    )
    const result = await markNotificationRead(id)
    setUnreadCount(result.unreadCount)
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
    setUnreadCount(0)
    await markAllNotificationsRead()
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      status,
      subscribe,
      markRead,
      markAllRead,
      reload: loadLatest,
    }),
    [notifications, unreadCount, status, subscribe, markRead, markAllRead, loadLatest],
  )

  return <LiveEventsContext.Provider value={value}>{children}</LiveEventsContext.Provider>
}

export default LiveEventsProvider
