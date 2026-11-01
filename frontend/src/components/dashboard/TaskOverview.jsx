import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'

import { getTasks } from '../../services/taskService'

/*
 * The four task statuses from the Task model. Every task has
 * exactly one, so together they add up to 100% and can be
 * drawn as one stacked bar.
 */
const STATUSES = [
  { name: 'Completed', className: 'completed' },
  { name: 'In Progress', className: 'in-progress' },
  { name: 'Pending', className: 'pending' },
  { name: 'To Do', className: 'to-do' },
]

function TaskOverview({ refreshKey = 0 }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // `loading` starts as true; live refreshes update quietly.
        setError('')

        const data = await getTasks()

        setTasks(data)
      } catch (error) {
        setError(
          error.message ||
            'Failed to load task overview'
        )
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [refreshKey])

  const totalTasks = tasks.length

  const statusCounts = STATUSES.map((status) => ({
    ...status,
    count: tasks.filter((task) => task.status === status.name)
      .length,
  }))

  const completed = statusCounts[0].count

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completed / totalTasks) * 100)
      : 0

  // Overdue isn't a status: it's any unfinished task past its due date.
  const today = new Date()

  const overdue = tasks.filter(
    (task) =>
      task.status !== 'Completed' &&
      task.dueDate &&
      new Date(task.dueDate) < today
  ).length

  const barDescription = statusCounts
    .map((status) => `${status.count} ${status.name.toLowerCase()}`)
    .join(', ')

  return (
    <section
      className="dash-panel"
      aria-labelledby="dash-tasks-title"
    >

      <header className="dash-panel-header">
        <div>
          <h2 id="dash-tasks-title">Tasks</h2>
          <p>
            {totalTasks > 0
              ? `${completed} of ${totalTasks} complete`
              : 'Progress across all tasks'}
          </p>
        </div>

        <Link to="/tasks" className="dash-panel-link">
          View all
        </Link>
      </header>


      {/* LOADING */}

      {loading && (
        <div className="dash-tasks" aria-busy="true">
          <span className="dash-skeleton dash-skeleton-bar" />
          <span className="dash-skeleton dash-skeleton-line" />
        </div>
      )}


      {/* ERROR */}

      {!loading && error && (
        <p className="dash-panel-message" role="alert">
          {error}
        </p>
      )}


      {/* EMPTY */}

      {!loading && !error && totalTasks === 0 && (
        <p className="dash-panel-message">
          No tasks yet.{' '}
          <Link to="/tasks">Create a task</Link>
        </p>
      )}


      {/* STACKED BAR + LEGEND */}

      {!loading && !error && totalTasks > 0 && (
        <div className="dash-tasks">

          <div className="dash-tasks-headline">
            <strong>{completionPercentage}%</strong>
            <span>complete</span>
          </div>

          <div
            className="dash-stacked-bar"
            role="img"
            aria-label={`Task status: ${barDescription}`}
          >
            {statusCounts
              .filter((status) => status.count > 0)
              .map((status) => (
                <span
                  key={status.name}
                  className={`dash-segment dash-segment-${status.className}`}
                  style={{
                    width: `${(status.count / totalTasks) * 100}%`,
                  }}
                />
              ))}
          </div>

          <ul className="dash-legend">
            {statusCounts.map((status) => (
              <li key={status.name}>
                <span
                  className={`dash-swatch dash-segment-${status.className}`}
                  aria-hidden="true"
                />
                {status.name}
                <span className="dash-legend-count">
                  {status.count}
                </span>
              </li>
            ))}
          </ul>

          {overdue > 0 && (
            <p className="dash-overdue">
              <CircleAlert size={16} aria-hidden="true" />
              {overdue === 1
                ? '1 task is past its due date'
                : `${overdue} tasks are past their due date`}
            </p>
          )}

        </div>
      )}

    </section>
  )
}

export default TaskOverview
