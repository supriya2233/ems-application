
import { useEffect, useState } from 'react'

import EmployeePicker from '../common/EmployeePicker'

function EditTaskModal({
  task,
  onClose,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    assignee: '',
    department: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!task) {
      return
    }

    setFormData({
      title: task.title || '',
      description: task.description || '',
      assigneeId: task.assigneeId || '',
      assignee: task.assignee || '',
      department: task.department || '',
      priority: task.priority || 'Medium',
      status: task.status || 'To Do',
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : '',
    })
  }, [task])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // The task belongs to the assignee's department.
  const handleAssigneeChange = (employee) => {
    setFormData((previous) => ({
      ...previous,
      assigneeId: employee?.employeeId || '',
      assignee: employee?.name || '',
      department: employee?.department || '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      await onUpdate(task._id, formData)

      onClose()
    } catch (error) {
      setError(
        error.message || 'Failed to update task'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">

      <div className="modal-card">

        <div className="modal-header">

          <div>
            <h2>Edit Task</h2>
            <p>
              Update task information and status.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-field">

            <label htmlFor="edit-title">
              Title
            </label>

            <input
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-field">

            <label htmlFor="edit-description">
              Description
            </label>

            <textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />

          </div>

          <div className="form-grid">

            <div className="form-field">

              <label htmlFor="edit-assignee">
                Assignee
              </label>

              <EmployeePicker
                id="edit-assignee"
                value={formData.assigneeId}
                onChange={handleAssigneeChange}
                required
              />

              {!formData.assigneeId && task?.assignee && (
                <span className="form-hint">
                  Previously “{task.assignee}”. Choose the employee to keep this task linked.
                </span>
              )}

            </div>

            <div className="form-field">

              <label htmlFor="edit-department">
                Department
              </label>

              <output id="edit-department" className="form-static">
                {formData.department || 'Follows the assignee'}
              </output>

            </div>

          </div>

          <div className="form-grid">

            <div className="form-field">

              <label htmlFor="edit-priority">
                Priority
              </label>

              <select
                id="edit-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

            </div>

            <div className="form-field">

              <label htmlFor="edit-status">
                Status
              </label>

              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="To Do">To Do</option>
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

          </div>

          <div className="form-field">

            <label htmlFor="edit-dueDate">
              Due Date
            </label>

            <input
              id="edit-dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />

          </div>

          <div className="modal-actions">

            <button
              type="button"
              className="ui-button ui-button-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ui-button ui-button-primary"
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : 'Save Changes'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default EditTaskModal