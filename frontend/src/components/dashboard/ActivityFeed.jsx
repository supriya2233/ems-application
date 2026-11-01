import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getActivity } from '../../services/activityService'
import { useLiveEvents } from '../live/liveEventsContext'
import { timeAgo } from '../../utils/timeAgo'

const ROWS_TO_SHOW = 8

/*
 * "What happened recently", newest first. New events arrive over
 * the live connection and are added to the top without a reload.
 */
function ActivityFeed() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getActivity({ limit: ROWS_TO_SHOW })
      .then(setItems)
      .catch((err) => setError(err.message || 'Failed to load activity'))
      .finally(() => setLoading(false))
  }, [])

  useLiveEvents((event) => {
    setItems((current) => [{ ...event, _id: event.id }, ...current].slice(0, ROWS_TO_SHOW))
  })

  return (
    <section className="dash-panel" aria-labelledby="dash-activity-title">
      <header className="dash-panel-header">
        <div>
          <h2 id="dash-activity-title">Recent activity</h2>
          <p>Updates live as changes are made</p>
        </div>
        <Link to="/activity" className="dash-panel-link">View all</Link>
      </header>

      {loading && <p className="dash-panel-message">Loading activity…</p>}

      {error && <p className="dash-panel-message">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="dash-panel-message">
          Nothing yet. Changes made anywhere in the app will appear here.
        </p>
      )}

      {items.length > 0 && (
        // aria-live: screen readers announce new lines as they arrive
        <ol className="activity-list" aria-live="polite">
          {items.map((item) => (
            <li key={item._id} className="activity-item">
              <span className={`activity-dot activity-dot-${item.module}`} aria-hidden="true" />
              <span className="activity-text">
                {item.link ? <Link to={item.link}>{item.summary}</Link> : item.summary}
                <time dateTime={item.at}>
                  {item.actor} · {timeAgo(item.at)}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default ActivityFeed
