import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { CLIENT_ID } from '../../services/apiClient'

/*
 * Live updates for the whole app. The values come from
 * <LiveEventsProvider>, which wraps the app in App.jsx.
 *
 *   const { unreadCount, notifications, markRead } = useNotifications()
 *   useLiveEvents((event) => …)              every activity event
 *   const refreshKey = useLiveRefresh(['leave'])
 *       a number that goes up when another tab changes leave;
 *       put it in a useEffect's dependency list to reload data.
 */
export const LiveEventsContext = createContext(null)

function useLive() {
  const value = useContext(LiveEventsContext)

  if (!value) {
    throw new Error('Live hooks must be used inside <LiveEventsProvider>')
  }

  return value
}

export function useNotifications() {
  return useLive()
}

export function useLiveEvents(callback) {
  const { subscribe } = useLive()

  // Always call the latest callback without re-subscribing.
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => subscribe((event) => callbackRef.current(event)), [subscribe])
}

/*
 * modules: e.g. ['leave', 'employees'], or null for every module.
 * Changes made in this tab are skipped: the page that made them
 * has already updated itself. Several events arriving close
 * together cause a single refresh.
 */
export function useLiveRefresh(modules = null) {
  const [refreshKey, setRefreshKey] = useState(0)
  const timerRef = useRef(null)
  const wanted = modules ? modules.join(',') : ''

  useLiveEvents((event) => {
    if (event.clientId === CLIENT_ID) return
    if (wanted && !wanted.split(',').includes(event.module)) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setRefreshKey((n) => n + 1), 300)
  })

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return refreshKey
}
