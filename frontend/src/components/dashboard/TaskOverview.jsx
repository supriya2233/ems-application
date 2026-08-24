import { useEffect, useState } from 'react'
import { getTasks } from '../../services/taskService'

function TaskOverview() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
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
  }, [])

  const totalTasks = tasks.length

  const completed = tasks.filter(
    (task) => task.status === 'Completed'
  ).length

  const inProgress = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length

  const pending = tasks.filter(
    (task) => task.status === 'Pending'
  ).length

  const today = new Date()

  const overdue = tasks.filter((task) => {
    if (task.status === 'Completed') {
      return false
    }

    if (!task.dueDate) {
      return false
    }

    return new Date(task.dueDate) < today
  }).length

  const taskItems = [
    {
      name: 'Completed',
      count: completed,
      type: '',
    },
    {
      name: 'In Progress',
      count: inProgress,
      type: 'warning',
    },
    {
      name: 'Pending',
      count: pending,
      type: '',
    },
    {
      name: 'Overdue',
      count: overdue,
      type: 'danger',
    },
  ]

  return (
    <section className="task-overview">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="dashboard-panel-header">

        <div>

          <h2>
            Task Overview
          </h2>

          <p>
            Current task distribution
          </p>

        </div>

        <a
          href="/tasks"
          className="dashboard-panel-link"
        >
          View all
        </a>

      </div>


      {/* ==========================================
          LOADING
      ========================================== */}

      {loading && (
        <div className="task-list">
          <p>Loading tasks...</p>
        </div>
      )}


      {/* ==========================================
          ERROR
      ========================================== */}

      {!loading && error && (
        <div className="task-list">
          <p>{error}</p>
        </div>
      )}


      {/* ==========================================
          EMPTY STATE
      ========================================== */}

      {!loading &&
        !error &&
        totalTasks === 0 && (
          <div className="task-list">
            <p>No tasks found.</p>
          </div>
        )}


      {/* ==========================================
          TASK STATISTICS
      ========================================== */}

      {!loading &&
        !error &&
        totalTasks > 0 && (

          <div className="task-list">

            {taskItems.map((task) => {

              const percentage =
                totalTasks > 0
                  ? Math.round(
                      (task.count /
                        totalTasks) *
                        100
                    )
                  : 0

              return (
                <div
                  className="task-item"
                  key={task.name}
                >

                  <div className="task-header">

                    <span className="task-name">
                      {task.name}
                    </span>

                    <span className="task-count">
                      {task.count}
                    </span>

                  </div>

                  <div className="task-progress">

                    <div
                      className={`task-progress-bar ${
                        task.type
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                </div>
              )
            })}

          </div>

        )}

    </section>
  )
}

export default TaskOverview