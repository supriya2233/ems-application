import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, GripVertical, Plus } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import { getAvatarColor, getInitials } from '../../utils/avatar'
import { PRIORITY_TONE, TASK_STATUSES, formatDue, isOverdue } from '../../utils/tasks'

const COLUMN_CLASS = {
  'To Do': 'todo',
  'In Progress': 'progress',
  Pending: 'pending',
  Completed: 'completed',
}

/*
 * Tasks as cards in status columns (same look as the recruitment
 * pipeline). Move a card by dragging it to another column, or with
 * the status select on the card (keyboard and touch).
 */
function TaskBoard({ tasks, onStatusChange, onAdd, onEdit, onDelete }) {
  const [dragId, setDragId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  const dragged = tasks.find((task) => task._id === dragId)
  const canDrop = (status) => Boolean(dragged) && dragged.status !== status

  const endDrag = () => {
    setDragId(null)
    setOverColumn(null)
  }

  return (
    <div className="pipeline-board task-board" aria-label="Task board">
      {TASK_STATUSES.map((status) => {
        const cards = tasks.filter((task) => task.status === status)
        const droppable = canDrop(status)
        const headingId = `task-column-${COLUMN_CLASS[status]}`

        return (
          <section
            key={status}
            className={[
              'pipeline-column',
              `task-column-${COLUMN_CLASS[status]}`,
              dragId && droppable && 'pipeline-column-droppable',
              overColumn === status && droppable && 'pipeline-column-over',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby={headingId}
            onDragOver={(event) => {
              if (!droppable) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setOverColumn(status)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setOverColumn(null)
            }}
            onDrop={(event) => {
              event.preventDefault()
              const task = dragged
              endDrag()
              if (task && task.status !== status) onStatusChange(task._id, status)
            }}
          >
            <header className="pipeline-column-header">
              <div>
                <h3 id={headingId}>{status}</h3>
              </div>
              <span className="pipeline-count" aria-label={`${cards.length} tasks`}>{cards.length}</span>
              <button
                type="button"
                className="task-column-add"
                onClick={() => onAdd(status)}
                aria-label={`Add a task to ${status}`}
                title={`Add a task to ${status}`}
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </header>

            {cards.length === 0 ? (
              <p className="pipeline-empty">{dragId && droppable ? 'Drop here' : 'No tasks'}</p>
            ) : (
              <ul className="pipeline-cards">
                {cards.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    dragging={dragId === task._id}
                    onDragStart={() => setDragId(task._id)}
                    onDragEnd={endDrag}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

function TaskCard({ task, dragging, onDragStart, onDragEnd, onStatusChange, onEdit, onDelete }) {
  const overdue = isOverdue(task)
  const selectId = `task-status-${task._id}`

  return (
    <li
      className={`pipeline-card task-card-v2 ${dragging ? 'pipeline-card-dragging' : ''}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', task._id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-head">
        <Badge variant={PRIORITY_TONE[task.priority] || 'neutral'}>{task.priority || 'Medium'}</Badge>
        <GripVertical className="pipeline-grip" size={16} aria-hidden="true" />
      </div>

      <button type="button" className="pipeline-card-name task-card-title" onClick={() => onEdit(task)}>
        {task.title}
      </button>
      {task.description && <p className="task-card-description">{task.description}</p>}

      <p className={`task-card-due${overdue ? ' task-card-overdue' : ''}`}>
        <CalendarClock size={13} aria-hidden="true" />
        {overdue ? `Overdue · ${formatDue(task.dueDate)}` : `Due ${formatDue(task.dueDate)}`}
      </p>

      <div className="task-card-assignee">
        <span className="person-avatar person-avatar-sm" style={{ background: getAvatarColor(task.assignee) }} aria-hidden="true">
          {getInitials(task.assignee)}
        </span>
        <span>
          {task.assigneeId ? (
            <Link className="person-link" to={`/employees/${task.assigneeId}`}>{task.assignee}</Link>
          ) : (
            task.assignee || 'Unassigned'
          )}
          {task.department && <small> · {task.department}</small>}
        </span>
      </div>

      <div className="pipeline-card-actions">
        <label className="visually-hidden" htmlFor={selectId}>Status of {task.title}</label>
        <select
          id={selectId}
          className="pipeline-stage-select"
          value={task.status}
          onChange={(event) => onStatusChange(task._id, event.target.value)}
        >
          {TASK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <Button size="small" variant="secondary" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>
          Edit
        </Button>
        <Button size="small" variant="ghost" onClick={() => onDelete(task._id)} aria-label={`Delete ${task.title}`}>
          Delete
        </Button>
      </div>
    </li>
  )
}

export default TaskBoard
