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
const LOCK_NAME = 'ems-live-stream'
const CHANNEL_NAME = 'ems-live'

/*
 * Live updates (Server-Sent Events) for the whole app, shared by
 * ALL open tabs:
 *
 *   - Browsers allow only ~6 open connections per server. A live
 *     stream keeps one open for as long as the page lives, so six
 *     tabs with their own stream would leave no room for normal
 *     API requests, and pages would hang while loading.
 *   - So only one tab (the "leader") opens the stream. The Web Locks
 *     API picks the leader: whoever holds the lock. The leader
 *     passes each message on to the other tabs with a
 *     BroadcastChannel. When the leader tab closes, its lock is
 *     released and another tab takes over automatically.
 *
 * What it shares with the app:
 *   - notifications + unread count (header bell, Notifications page)
 *   - activity events (dashboard feed, pages that refresh themselves)
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

    /* ---- What to do with each kind of message (every tab) ---- */
    const handlers = {
      activity: (event) => {
        subscribersRef.current.forEach((callback) => callback(event))
      },

      notification: (notification) => {
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
      },

      'notifications-read': (data) => {
        setUnreadCount(data.unreadCount)
        if (data.unreadCount === 0) {
          setNotifications((current) => current.map((item) => ({ ...item, read: true })))
        }
      },

      status: (value) => setStatus(value),

      // The stream reconnected: notifications may have been missed.
      resync: () => loadLatest(),
    }

    const handle = (name, data) => handlers[name]?.(data)

    /* ---- Tabs talk to each other on this channel ---- */
    const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL_NAME) : null

    if (channel) {
      channel.onmessage = (message) => handle(message.data.name, message.data.data)
    }

    // Handle here and pass on to the other tabs.
    const emit = (name, data) => {
      handle(name, data)
      channel?.postMessage({ name, data })
    }

    /* ---- The leader opens the one real connection ---- */
    let closed = false
    let source = null
    let releaseLock = null

    const openStream = () => {
      source = new EventSource(`${API_BASE}/stream`)
      let hasConnected = false

      const read = (message) => {
        try {
          return JSON.parse(message.data)
        } catch {
          return null
        }
      }

      source.addEventListener('ready', () => {
        emit('status', 'live')
        if (hasConnected) emit('resync')
        hasConnected = true
      })

      for (const name of ['activity', 'notification', 'notifications-read']) {
        source.addEventListener(name, (message) => {
          const data = read(message)
          if (data) emit(name, data)
        })
      }

      source.onerror = () => emit('status', 'offline')
    }

    const lockAbort = new AbortController()

    if (navigator.locks?.request) {
      navigator.locks
        .request(LOCK_NAME, { signal: lockAbort.signal }, () => {
          if (closed) return undefined
          openStream()
          // Hold the lock until this tab closes or unmounts.
          return new Promise((resolve) => {
            releaseLock = resolve
          })
        })
        .catch(() => {
          // Aborted while waiting: this tab was closed first.
        })

      // Followers: another tab already streams for us.
      setStatus('live')
    } else {
      openStream() // very old browser: one stream per tab
    }

    const stop = () => {
      closed = true
      lockAbort.abort()
      source?.close()
      source = null
      releaseLock?.()
      channel?.close()
    }

    // Leaving the page (closing, reloading, navigating away)
    window.addEventListener('pagehide', stop)

    // Coming back with the browser's Back button can restore the old
    // page from memory, with the stream already closed: reload it.
    const handlePageShow = (event) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pagehide', stop)
      window.removeEventListener('pageshow', handlePageShow)
      stop()
    }
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
