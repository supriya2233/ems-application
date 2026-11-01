import { Link } from 'react-router-dom'

import { dayHeading, groupByDay, moduleLabel, timeOfDay } from '../../utils/activity'

/*
 * Activity entries grouped under day headings:
 *
 *   TODAY
 *   14:05  ● Leave approved: Priya Sharma, 3–5 Nov      Leave
 *            Administrator
 *
 * Used by the Activity log page and the employee profile.
 *   entries        newest first
 *   showModule     the module label on the right (off on narrow lists)
 *   freshIds       ids that just arrived live; briefly highlighted
 */
function ActivityTimeline({ entries, showModule = true, freshIds, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`

  return (
    <div className="timeline">
      {groupByDay(entries).map((group) => (
        <section key={group.key} className="timeline-day" aria-label={dayHeading(group.key)}>
          <Heading className="timeline-day-heading">{dayHeading(group.key)}</Heading>

          <ol className="timeline-list">
            {group.entries.map((entry) => (
              <li
                key={entry._id}
                className={`timeline-item${freshIds?.has(entry._id) ? ' timeline-item-fresh' : ''}`}
              >
                <time className="timeline-time" dateTime={entry.at}>{timeOfDay(entry.at)}</time>
                <span className={`activity-dot activity-dot-${entry.module}`} aria-hidden="true" />
                <div className="timeline-text">
                  {entry.link ? <Link to={entry.link}>{entry.summary}</Link> : <span>{entry.summary}</span>}
                  <span className="timeline-meta">
                    {entry.actor}
                    {entry.employeeId && (
                      <>
                        {' · '}
                        <Link to={`/employees/${entry.employeeId}`}>{entry.employeeId}</Link>
                      </>
                    )}
                  </span>
                </div>
                {showModule && <span className="timeline-module">{moduleLabel(entry.module)}</span>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

export default ActivityTimeline
