import { useState } from 'react'

import Button from '../common/Button'
import EmployeePicker from '../common/EmployeePicker'
import Modal from '../common/Modal'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../utils/tasks'

const valuesFrom = (task, initialStatus) => ({
  title: task?.title || '',
  description: task?.description || '',
  assigneeId: task?.assigneeId || '',
  assignee: task?.assignee || '',
  department: task?.department || '',
  priority: task?.priority || 'Medium',
  status: task?.status || initialStatus || 'To Do',
  dueDate: task?.dueDate ? String(task.dueDate).slice(0, 10) : '',
})

/*
 * Add or edit a task.
 *   task           the task to edit; leave out to add one
 *   initialStatus  status for a new task (the board column's "+")
 *   onSave(data)   saves; throw to show the error in the dialog
 */
function TaskModal({ task, initialStatus, onClose, onSave }) {
  const [values, setValues] = useState(() => valuesFrom(task, initialStatus))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const setField = (field) => (event) => {
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
  }

  // The task belongs to the assignee's department.
  const handleAssigneeChange = (employee) => {
    setValues((current) => ({
      ...current,
      assigneeId: employee?.employeeId || '',
      assignee: employee?.name || '',
      department: employee?.department || '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await onSave(values)
      onClose()
    } catch (err) {
      setError(err.message || `Failed to ${task ? 'update' : 'create'} task`)
      setSubmitting(false)
    }
  }

  return (
    <Modal title={task ? 'Edit task' : 'Add task'} onClose={() => !submitting && onClose()}>
      <form onSubmit={handleSubmit}>
        {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <span className="detail-label">Task ID</span>
            <output className="form-static">{task?.taskId || 'Assigned automatically'}</output>
          </div>

          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input id="task-title" value={values.title} onChange={setField('title')} placeholder="What needs doing" required />
          </div>

          <div className="form-group form-full-width">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={values.description}
              onChange={setField('description')}
              placeholder="Details, links, acceptance criteria…"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-assignee">Assignee</label>
            <EmployeePicker id="task-assignee" value={values.assigneeId} onChange={handleAssigneeChange} required />
            {!values.assigneeId && task?.assignee && (
              <span className="form-hint">
                Previously “{task.assignee}”. Choose the employee to keep this task linked.
              </span>
            )}
          </div>

          <div className="form-group">
            <span className="detail-label">Department</span>
            <output className="form-static">{values.department || 'Follows the assignee'}</output>
          </div>

          <div className="form-group">
            <label htmlFor="task-priority">Priority</label>
            <select id="task-priority" value={values.priority} onChange={setField('priority')}>
              {TASK_PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-status">Status</label>
            <select id="task-status" value={values.status} onChange={setField('status')}>
              {TASK_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-due">Due date</label>
            <input id="task-due" type="date" value={values.dueDate} onChange={setField('dueDate')} required />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>{task ? 'Save changes' : 'Create task'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default TaskModal
