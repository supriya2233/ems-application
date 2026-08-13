import { useMemo, useState } from 'react'
import { tasks, taskStats } from '../data/tasks'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'

const columns = [
  {
    key: 'To Do',
    title: 'To Do',
  },
  {
    key: 'In Progress',
    title: 'In Progress',
  },
  {
    key: 'Pending',
    title: 'Pending',
  },
  {
    key: 'Completed',
    title: 'Completed',
  },
]

function Tasks() {

  const [view, setView] = useState('board')

  const groupedTasks = useMemo(() => {

    return columns.reduce((groups, column) => {

      groups[column.key] = tasks.filter(
        (task) => task.status === column.key
      )

      return groups

    }, {})

  }, [])

  return (
    <div className="module-page">

      {/* Header */}

      <PageHeader
  eyebrow="WORK MANAGEMENT"
  title="Tasks"
  description="Organize, track and monitor work across your organization."
  action={
    <Button>
      + Add Task
    </Button>
  }
/>

      {/* Stats */}

      <div className="stats-grid task-stats">

        <div className="info-card">
          <span>Total Tasks</span>
          <strong>{taskStats.total}</strong>
          <small>All assigned tasks</small>
        </div>

        <div className="info-card">
          <span>To Do</span>
          <strong>{taskStats.todo}</strong>
          <small>Not started</small>
        </div>

        <div className="info-card">
          <span>In Progress</span>
          <strong>{taskStats.inProgress}</strong>
          <small>Currently being worked on</small>
        </div>

        <div className="info-card">
          <span>Completed</span>
          <strong>{taskStats.completed}</strong>
          <small>Finished tasks</small>
        </div>

      </div>

      {/* Toolbar */}

      <div className="task-toolbar">

        <div>
          <h2>Task Board</h2>
          <p>Current task distribution</p>
        </div>

        <div className="view-toggle">

          <button
            className={view === 'board' ? 'active' : ''}
            onClick={() => setView('board')}
          >
            Board
          </button>

          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            List
          </button>

        </div>

      </div>

      {/* Kanban */}

      {view === 'board' && (

        <div className="kanban-board">

          {columns.map((column) => (

            <section
              className="kanban-column"
              key={column.key}
            >

              <div className="kanban-column-header">

                <div>
                  <h3>{column.title}</h3>
                  <span>
                    {groupedTasks[column.key].length}
                  </span>
                </div>

                <button>+</button>

              </div>

              <div className="kanban-tasks">

                {groupedTasks[column.key].map((task) => (

                  <article
                    className="task-card"
                    key={task.id}
                  >

                    <div className="task-card-top">

                      <span
                        className={`priority priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>

                      <button className="more-button">
                        •••
                      </button>

                    </div>

                    <h4>{task.title}</h4>

                    <p>{task.description}</p>

                    <div className="task-card-meta">

                      <span>
                        {task.department}
                      </span>

                      <span>
                        Due {task.dueDate}
                      </span>

                    </div>

                    <div className="task-assignee">

                      <div className="mini-avatar">
                        {task.assignee
                          .split(' ')
                          .map((name) => name[0])
                          .join('')
                        }
                      </div>

                      <span>{task.assignee}</span>

                    </div>

                  </article>

                ))}

              </div>

            </section>

          ))}

        </div>

      )}

      {/* List */}

      {view === 'list' && (

        <div className="task-list">

          <div className="task-list-header">
            <span>Task</span>
            <span>Department</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due date</span>
          </div>

          {tasks.map((task) => (

            <div
              className="task-list-row"
              key={task.id}
            >

              <div>
                <strong>{task.title}</strong>
                <small>{task.description}</small>
              </div>

              <span>{task.department}</span>

              <span>{task.assignee}</span>

              <span
                className={`priority priority-${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>

              <span className="task-status">
                {task.status}
              </span>

              <span>{task.dueDate}</span>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}

export default Tasks