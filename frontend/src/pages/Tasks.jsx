import { useEffect, useMemo, useState } from 'react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService'
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
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [view, setView] = useState('board')

  const [showModal, setShowModal] = useState(false)

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    department: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
  })

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getTasks()

        setTasks(data)
      } catch (error) {
        setError(error.message || 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,

      todo: tasks.filter(
        (task) => task.status === 'To Do',
      ).length,

      inProgress: tasks.filter(
        (task) => task.status === 'In Progress',
      ).length,

      completed: tasks.filter(
        (task) => task.status === 'Completed',
      ).length,
    }
  }, [tasks])

  const groupedTasks = useMemo(() => {
    return columns.reduce((groups, column) => {
      groups[column.key] = tasks.filter(
        (task) => task.status === column.key,
      )

      return groups
    }, {})
  }, [tasks])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setNewTask((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleAddTask = async (event) => {
    event.preventDefault()

    try {
      setError('')

      const task = {
        taskId: `TASK${String(tasks.length + 1).padStart(3, '0')}`,
        ...newTask,
      }

      const createdTask = await createTask(task)

      setTasks((previous) => [
        createdTask,
        ...previous,
      ])

      setNewTask({
        title: '',
        description: '',
        assignee: '',
        department: '',
        priority: 'Medium',
        status: 'To Do',
        dueDate: '',
      })

      setShowModal(false)
    } catch (error) {
      setError(error.message || 'Failed to create task')
    }
  }

  const handleDeleteTask = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?',
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteTask(id)

      setTasks((previous) =>
        previous.filter((task) => task._id !== id),
      )
    } catch (error) {
      setError(error.message || 'Failed to delete task')
    }
  }

  const handleStatusChange = async (task, status) => {
    try {
      setError('')

      const updatedTask = await updateTask(
        task._id,
        { status },
      )

      setTasks((previous) =>
        previous.map((item) =>
          item._id === updatedTask._id
            ? updatedTask
            : item,
        ),
      )
    } catch (error) {
      setError(error.message || 'Failed to update task')
    }
  }

  return (
    <div className="module-page">

      <PageHeader
        eyebrow="WORK MANAGEMENT"
        title="Tasks"
        description="Organize, track and monitor work across your organization."
        action={
          <Button onClick={() => setShowModal(true)}>
            + Add Task
          </Button>
        }
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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

      {/* Loading */}

      {loading && (
        <div className="loading-message">
          Loading tasks...
        </div>
      )}

      {/* Kanban Board */}

      {!loading && view === 'board' && (

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

                <button
                  onClick={() => {
                    setNewTask((previous) => ({
                      ...previous,
                      status: column.key,
                    }))

                    setShowModal(true)
                  }}
                >
                  +
                </button>

              </div>

              <div className="kanban-tasks">

                {groupedTasks[column.key].map((task) => (

                  <article
                    className="task-card"
                    key={task._id}
                  >

                    <div className="task-card-top">

                      <span
                        className={`priority priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>

                      <button
                        className="more-button"
                        onClick={() =>
                          handleDeleteTask(task._id)
                        }
                      >
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
                        Due{' '}
                        {new Date(
                          task.dueDate,
                        ).toLocaleDateString()}
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

                      <span>
                        {task.assignee}
                      </span>

                    </div>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(
                          task,
                          event.target.value,
                        )
                      }
                    >
                      {columns.map((status) => (
                        <option
                          key={status.key}
                          value={status.key}
                        >
                          {status.title}
                        </option>
                      ))}
                    </select>

                  </article>

                ))}

              </div>

            </section>

          ))}

        </div>

      )}

      {/* List */}

      {!loading && view === 'list' && (

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
              key={task._id}
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

              <span>
                {new Date(
                  task.dueDate,
                ).toLocaleDateString()}
              </span>

            </div>

          ))}

        </div>

      )}

      {/* Add Task Modal */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>Add Task</h2>
                <p>Create a new task.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleAddTask}>

              <div className="form-grid">

                <label>
                  Task title

                  <input
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Description

                  <input
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Assignee

                  <input
                    name="assignee"
                    value={newTask.assignee}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Department

                  <input
                    name="department"
                    value={newTask.department}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Priority

                  <select
                    name="priority"
                    value={newTask.priority}
                    onChange={handleInputChange}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>

                <label>
                  Status

                  <select
                    name="status"
                    value={newTask.status}
                    onChange={handleInputChange}
                  >
                    {columns.map((column) => (
                      <option
                        key={column.key}
                        value={column.key}
                      >
                        {column.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Due date

                  <input
                    type="date"
                    name="dueDate"
                    value={newTask.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </label>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit">
                  Add Task
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Tasks