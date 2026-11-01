import { useEffect, useState } from 'react'

import ActivityTimeline from './ActivityTimeline'
import { useLiveEvents } from '../live/liveEventsContext'
import { getActivity } from '../../services/activityService'

const ROWS = 10

/*
 * The latest things that happened to one person (profile page).
 * New events about them are added live.
 */
function EmployeeTimeline({ employeeId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)

    getActivity({ employeeId, limit: ROWS })
      .then((data) => {
        if (!ignore) {
          setEntries(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load the timeline')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [employeeId])

  useLiveEvents((event) => {
    if (event.employeeId !== employeeId) return
    setEntries((current) => [{ ...event, _id: event.id }, ...current].slice(0, ROWS))
  })

  if (loading) return <p className="p360-empty">Loading timeline…</p>
  if (error) return <p className="p360-empty">{error}</p>
  if (entries.length === 0) {
    return <p className="p360-empty">Nothing recorded yet. Changes to this person’s records will show up here.</p>
  }

  return <ActivityTimeline entries={entries} />
}

export default EmployeeTimeline
