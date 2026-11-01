import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CircleCheck, Columns3, List, ListChecks, Loader, Plus } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import DataTable from '../components/common/DataTable'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import StatCard from '../components/common/StatCard'
import AddTaskModal from '../components/tasks/AddTaskModal'
import EditTaskModal from '../components/tasks/EditTaskModal'
import TaskBoard from '../components/tasks/TaskBoard'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { createTask, deleteTask, getTasks, updateTask } from '../services/taskService'
import { PRIORITY_TONE, TASK_PRIORITIES, TASK_STATUSES, formatDue, isOverdue } from '../utils/tasks'

const VIEW_KEY = 'ems.tasks.view'

function Tasks() {
  const confirm = useConfirm()
  const toast = useToast()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'board')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All')
  const [priority, setPriority] = useState('All')
  const [overdueOnly, setOverdueOnly] = useState(false)

  // null (closed) or { status } for a new task in that column
  const [adding, setAdding] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  // Reload when tasks change in another tab.
  const refreshKey = useLiveRefresh(['tasks'])

  useEffect(() => {
    let ignore = false

    getTasks()
      .then((data) => {
        if (!ignore) {
          setTasks(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load tasks')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const changeView = (next) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  /* ---------------- Actions ---------------- */

  const replaceTask = (updated) =>
    setTasks((current) => current.map((task) => (task._id === updated._id ? updated : task)))

  // Errors are thrown so the dialog can show them.
  const handleCreateTask = async (taskData) => {
    const created = await createTask(taskData)
    setTasks((current) => [created, ...current])
    toast.success(`Task “${created.title}” created`)
  }

  const handleUpdateTask = async (taskId, taskData) => {
    const updated = await updateTask(taskId, taskData)
    replaceTask(updated)
    toast.success('Task saved')
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      replaceTask(await updateTask(taskId, { status }))
    } catch (err) {
      toast.error(err.message || 'Failed to update task status')
    }
  }

  const handleDeleteTask = async (taskId) => {
    const task = tasks.find((item) => item._id === taskId)
    const ok = await confirm({
      title: 'Delete task?',
      message: task ? `“${task.title}” will be permanently removed.` : 'This task will be permanently removed.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteTask(taskId)
      setTasks((current) => current.filter((item) => item._id !== taskId))
      if (editingTask?._id === taskId) setEditingTask(null)
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete task')
    }
  }

  /* ---------------- Numbers & filters ---------------- */

  const stats = useMemo(() => {
    const count = (status) => tasks.filter((task) => task.status === status).length
    return {
      total: tasks.length,
      open: tasks.length - count('Completed'),
      todo: count('To Do'),
      inProgress: count('In Progress'),
      pending: count('Pending'),
      completed: count('Completed'),
      overdue: tasks.filter((task) => isOverdue(task)).length,
    }
  }, [tasks])

  const departments = useMemo(
    () => [...new Set(tasks.map((task) => task.department).filter(Boolean))].sort(),
    [tasks],
  )

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesSearch =
        !text ||
        [task.title, task.description, task.assignee, task.taskId].some((field) =>
          String(field || '').toLowerCase().includes(text),
        )
      return (
        matchesSearch &&
        (department === 'All' || task.department === department) &&
        (priority === 'All' || task.priority === priority) &&
        (!overdueOnly || isOverdue(task))
      )
    })
  }, [tasks, search, department, priority, overdueOnly])

  const isFiltered = Boolean(search) || department !== 'All' || priority !== 'All' || overdueOnly

  /* ---------------- List view ---------------- */

  const columns = [
    {
      key: 'task',
      label: 'Task',
      render: (task) => (
        <>
          <div className="table-primary">{task.title}</div>
          {task.description && <div className="table-secondary task-list-description">{task.description}</div>}
        </>
      ),
    },
    {
      key: 'assignee',
      label: 'Assignee',
      render: (task) => (
        <>
          <div className="table-primary">
            {task.assigneeId ? (
              <Link className="person-link" to={`/employees/${task.assigneeId}`}>{task.assignee}</Link>
            ) : (
              task.assignee || 'Unassigned'
            )}
          </div>
          <div className="table-secondary">{task.department}</div>
        </>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (task) => <Badge variant={PRIORITY_TONE[task.priority] || 'neutral'}>{task.priority}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (task) => (
        <select
          aria-label={`Status of ${task.title}`}
          className="table-select"
          value={task.status}
          onChange={(event) => handleStatusChange(task._id, event.target.value)}
        >
          {TASK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      ),
    },
    {
      key: 'due',
      label: 'Due',
      render: (task) => (
        <span className={isOverdue(task) ? 'task-card-overdue' : undefined}>
          {formatDue(task.dueDate)}
          {isOverdue(task) && <span className="table-secondary"> · overdue</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (task) => (
        <div className="table-actions">
          <Button size="small" variant="secondary" onClick={() => setEditingTask(task)} aria-label={`Edit ${task.title}`}>
            Edit
          </Button>
          <Button size="small" variant="ghost" onClick={() => handleDeleteTask(task._id)} aria-label={`Delete ${task.title}`}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const emptyState = (
    <EmptyState
      icon={<ListChecks size={20} aria-hidden="true" />}
      title={isFiltered ? 'No tasks match' : 'No tasks yet'}
      description={isFiltered ? 'Try a different search or filter.' : 'Create a task and assign it to someone; it shows up on their profile too.'}
      action={!isFiltered && <Button onClick={() => setAdding({ status: 'To Do' })}>Add first task</Button>}
    />
  )

  /* ---------------- Page ---------------- */

  return (
    <div className="tasks-page">
      <PageHeader
        title="Tasks"
        description="Organise, assign and track work across teams. Drag cards between columns to update their status."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={() => setAdding({ status: 'To Do' })}>
            Add task
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Tasks at a glance">
        <StatCard
          title="Open"
          value={stats.open}
          icon={<ListChecks size={16} aria-hidden="true" />}
          description={`${stats.todo} to do · ${stats.pending} pending`}
        />
        <StatCard
          title="In progress"
          value={stats.inProgress}
          icon={<Loader size={16} aria-hidden="true" />}
          description="being worked on"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={<CalendarClock size={16} aria-hidden="true" />}
          warning={stats.overdue > 0}
          description={stats.overdue > 0 ? 'past their due date' : 'nothing late'}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CircleCheck size={16} aria-hidden="true" />}
          description={`of ${stats.total} in total`}
        />
      </section>

      <section className="ui-card" aria-labelledby="tasks-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="tasks-title">{view === 'board' ? 'Task board' : 'All tasks'}</h2>
            <p>{isFiltered ? `${filtered.length} of ${tasks.length} tasks shown` : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}</p>
          </div>

          <div className="view-toggle" role="group" aria-label="Show tasks as">
            <button type="button" aria-pressed={view === 'board'} className={view === 'board' ? 'is-active' : ''} onClick={() => changeView('board')}>
              <Columns3 size={15} aria-hidden="true" /> Board
            </button>
            <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => changeView('list')}>
              <List size={15} aria-hidden="true" /> List
            </button>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search title, assignee or ID…" />
          <select aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="All">All departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="All">All priorities</option>
            {TASK_PRIORITIES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button
            type="button"
            className="filter-chip"
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly((value) => !value)}
          >
            Overdue only
            <span className="filter-chip-count">{stats.overdue}</span>
          </button>
        </div>

        {view === 'list' ? (
          <DataTable caption="Tasks" columns={columns} data={filtered} loading={loading} emptyState={emptyState} />
        ) : loading ? (
          <p className="ui-loading">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          emptyState
        ) : (
          <TaskBoard
            tasks={filtered}
            onStatusChange={handleStatusChange}
            onAdd={(status) => setAdding({ status })}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
          />
        )}
      </section>

      {adding && (
        <AddTaskModal initialStatus={adding.status} onClose={() => setAdding(null)} onCreate={handleCreateTask} />
      )}

      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={handleUpdateTask} />
      )}
    </div>
  )
}

export default Tasks
