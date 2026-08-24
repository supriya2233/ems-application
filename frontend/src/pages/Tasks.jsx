import { useEffect, useMemo, useState } from 'react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService'

import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import AddTaskModal from '../components/tasks/AddTaskModal'
import EditTaskModal from '../components/tasks/EditTaskModal'

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

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  /*
   * ------------------------------------------------
   * LOAD TASKS
   * ------------------------------------------------
   */

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getTasks()

        setTasks(data)
      } catch (error) {
        setError(
          error.message || 'Failed to load tasks'
        )
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  /*
   * ------------------------------------------------
   * CREATE TASK
   * ------------------------------------------------
   */

  const handleCreateTask = async (taskData) => {
    try {
      setError('')

      const createdTask = await createTask(taskData)

      setTasks((previousTasks) => [
        createdTask,
        ...previousTasks,
      ])
    } catch (error) {
      throw new Error(
        error.message || 'Failed to create task'
      )
    }
  }

  /*
   * ------------------------------------------------
   * UPDATE TASK
   * ------------------------------------------------
   */

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      setError('')

      const updatedTask = await updateTask(
        taskId,
        taskData
      )

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === taskId
            ? updatedTask
            : task
        )
      )
    } catch (error) {
      throw new Error(
        error.message || 'Failed to update task'
      )
    }
  }

  /*
   * ------------------------------------------------
   * DELETE TASK
   * ------------------------------------------------
   */

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteTask(taskId)

      setTasks((previousTasks) =>
        previousTasks.filter(
          (task) => task._id !== taskId
        )
      )

      if (editingTask?._id === taskId) {
        setEditingTask(null)
      }
    } catch (error) {
      setError(
        error.message || 'Failed to delete task'
      )
    }
  }

  /*
   * ------------------------------------------------
   * CHANGE STATUS
   * ------------------------------------------------
   */

  const handleStatusChange = async (
    taskId,
    newStatus
  ) => {
    try {
      setError('')

      const updatedTask = await updateTask(
        taskId,
        {
          status: newStatus,
        }
      )

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === taskId
            ? updatedTask
            : task
        )
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to update task status'
      )
    }
  }

  /*
   * ------------------------------------------------
   * TASK STATISTICS
   * ------------------------------------------------
   */

  const taskStats = useMemo(() => {
    const today = new Date()

    return {
      total: tasks.length,

      todo: tasks.filter(
        (task) => task.status === 'To Do'
      ).length,

      inProgress: tasks.filter(
        (task) => task.status === 'In Progress'
      ).length,

      pending: tasks.filter(
        (task) => task.status === 'Pending'
      ).length,

      completed: tasks.filter(
        (task) => task.status === 'Completed'
      ).length,

      overdue: tasks.filter((task) => {
        if (task.status === 'Completed') {
          return false
        }

        if (!task.dueDate) {
          return false
        }

        return new Date(task.dueDate) < today
      }).length,
    }
  }, [tasks])

  /*
   * ------------------------------------------------
   * GROUP TASKS FOR KANBAN BOARD
   * ------------------------------------------------
   */

  const groupedTasks = useMemo(() => {
    return columns.reduce((groups, column) => {
      groups[column.key] = tasks.filter(
        (task) => task.status === column.key
      )

      return groups
    }, {})
  }, [tasks])

  /*
   * ------------------------------------------------
   * FORMAT DATE
   * ------------------------------------------------
   */

  const formatDate = (date) => {
    if (!date) {
      return '-'
    }

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
  }

  /*
   * ------------------------------------------------
   * INITIALS
   * ------------------------------------------------
   */

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  /*
   * ------------------------------------------------
   * LOADING STATE
   * ------------------------------------------------
   */

  if (loading) {
    return (
      <div className="module-page">

        <PageHeader
          eyebrow="WORK MANAGEMENT"
          title="Tasks"
          description="Organize, track and monitor work across your organization."
        />

        <div className="content-section">
          <p>Loading tasks...</p>
        </div>

      </div>
    )
  }

  /*
   * ------------------------------------------------
   * PAGE
   * ------------------------------------------------
   */

  return (
    <div className="module-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <PageHeader
        eyebrow="WORK MANAGEMENT"
        title="Tasks"
        description="Organize, track and monitor work across your organization."
        action={
          <Button
            onClick={() => {
              setError('')
              setShowAddModal(true)
            }}
          >
            + Add Task
          </Button>
        }
      />

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="content-section">
          <p>{error}</p>
        </div>
      )}

      {/* ==========================================
          STATISTICS
      ========================================== */}

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

      {/* ==========================================
          TOOLBAR
      ========================================== */}

      <div className="task-toolbar">

        <div>
          <h2>Task Board</h2>

          <p>
            Current task distribution
          </p>
        </div>

        <div className="view-toggle">

          <button
            className={
              view === 'board'
                ? 'active'
                : ''
            }
            onClick={() => setView('board')}
          >
            Board
          </button>

          <button
            className={
              view === 'list'
                ? 'active'
                : ''
            }
            onClick={() => setView('list')}
          >
            List
          </button>

        </div>

      </div>

      {/* ==========================================
          EMPTY STATE
      ========================================== */}

      {tasks.length === 0 && (
        <div className="content-section">

          <p>
            No tasks found.
          </p>

          <Button
            onClick={() => {
              setError('')
              setShowAddModal(true)
            }}
          >
            + Add First Task
          </Button>

        </div>
      )}

      {/* ==========================================
          KANBAN BOARD
      ========================================== */}

      {tasks.length > 0 &&
        view === 'board' && (

          <div className="kanban-board">

            {columns.map((column) => (

              <section
                className="kanban-column"
                key={column.key}
              >

                {/* COLUMN HEADER */}

                <div className="kanban-column-header">

                  <div>

                    <h3>
                      {column.title}
                    </h3>

                    <span>
                      {
                        groupedTasks[
                          column.key
                        ]?.length || 0
                      }
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setShowAddModal(true)
                    }}
                  >
                    +
                  </button>

                </div>

                {/* TASKS */}

                <div className="kanban-tasks">

                  {groupedTasks[
                    column.key
                  ]?.map((task) => (

                    <article
                      className="task-card"
                      key={task._id}
                    >

                      {/* TOP */}

                      <div className="task-card-top">

                        <span
                          className={`priority priority-${(
                            task.priority ||
                            'Medium'
                          ).toLowerCase()}`}
                        >
                          {task.priority}
                        </span>

                        <button
                          type="button"
                          className="more-button"
                          onClick={() =>
                            setEditingTask(task)
                          }
                        >
                          ...
                        </button>

                      </div>

                      {/* TITLE */}

                      <h4>
                        {task.title}
                      </h4>

                      {/* DESCRIPTION */}

                      <p>
                        {task.description}
                      </p>

                      {/* META */}

                      <div className="task-card-meta">

                        <span>
                          {task.department}
                        </span>

                        <span>
                          Due{' '}
                          {formatDate(
                            task.dueDate
                          )}
                        </span>

                      </div>

                      {/* ASSIGNEE */}

                      <div className="task-assignee">

                        <div className="mini-avatar">
                          {getInitials(
                            task.assignee
                          )}
                        </div>

                        <span>
                          {task.assignee}
                        </span>

                      </div>

                      {/* STATUS CONTROL */}

                      <div
                        style={{
                          marginTop: '12px',
                        }}
                      >

                        <select
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(
                              task._id,
                              event.target.value
                            )
                          }
                        >

                          <option value="To Do">
                            To Do
                          </option>

                          <option value="In Progress">
                            In Progress
                          </option>

                          <option value="Pending">
                            Pending
                          </option>

                          <option value="Completed">
                            Completed
                          </option>

                        </select>

                      </div>

                      {/* EDIT / DELETE */}

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '10px',
                        }}
                      >

                        <Button
                          variant="secondary"
                          onClick={() =>
                            setEditingTask(task)
                          }
                        >
                          Edit
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() =>
                            handleDeleteTask(
                              task._id
                            )
                          }
                        >
                          Delete
                        </Button>

                      </div>

                    </article>

                  ))}

                </div>

              </section>

            ))}

          </div>
        )}

      {/* ==========================================
          LIST VIEW
      ========================================== */}

      {tasks.length > 0 &&
        view === 'list' && (

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

                {/* TASK */}

                <div>

                  <strong>
                    {task.title}
                  </strong>

                  <small>
                    {task.description}
                  </small>

                </div>

                {/* DEPARTMENT */}

                <span>
                  {task.department}
                </span>

                {/* ASSIGNEE */}

                <span>
                  {task.assignee}
                </span>

                {/* PRIORITY */}

                <span
                  className={`priority priority-${(
                    task.priority ||
                    'Medium'
                  ).toLowerCase()}`}
                >
                  {task.priority}
                </span>

                {/* STATUS */}

                <select
                  value={task.status}
                  onChange={(event) =>
                    handleStatusChange(
                      task._id,
                      event.target.value
                    )
                  }
                >

                  <option value="To Do">
                    To Do
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                </select>

                {/* DATE */}

                <span>
                  {formatDate(task.dueDate)}
                </span>

                {/* ACTIONS */}

                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                  }}
                >

                  <Button
                    variant="secondary"
                    onClick={() =>
                      setEditingTask(task)
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleDeleteTask(
                        task._id
                      )
                    }
                  >
                    Delete
                  </Button>

                </div>

              </div>

            ))}

          </div>
        )}

      {/* ==========================================
          ADD TASK MODAL
      ========================================== */}

      {showAddModal && (

        <AddTaskModal
          onClose={() =>
            setShowAddModal(false)
          }

          onCreate={handleCreateTask}
        />

      )}

      {/* ==========================================
          EDIT TASK MODAL
      ========================================== */}

      {editingTask && (

        <EditTaskModal
          task={editingTask}

          onClose={() =>
            setEditingTask(null)
          }

          onUpdate={handleUpdateTask}
        />

      )}

    </div>
  )
}

export default Tasks