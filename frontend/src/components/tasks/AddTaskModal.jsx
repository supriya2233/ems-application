import { useState } from 'react'

function AddTaskModal({
  onClose,
  onCreate,
}) {
  const [formData, setFormData] = useState({
    taskId: '',
    title: '',
    description: '',
    assignee: '',
    department: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      await onCreate(formData)

      onClose()
    } catch (error) {
      setError(
        error.message || 'Failed to create task'
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
            <h2>Add Task</h2>
            <p>Create a new task for your organization.</p>
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

          <div className="form-grid">

            <div className="form-field">

              <label htmlFor="taskId">
                Task ID
              </label>

              <input
                id="taskId"
                name="taskId"
                value={formData.taskId}
                onChange={handleChange}
                placeholder="TASK002"
                required
              />

            </div>

            <div className="form-field">

              <label htmlFor="title">
                Title
              </label>

              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />

            </div>

          </div>

          <div className="form-field">

            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task"
              rows="4"
            />

          </div>

          <div className="form-grid">

            <div className="form-field">

              <label htmlFor="assignee">
                Assignee
              </label>

              <input
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="Employee name"
                required
              />

            </div>

            <div className="form-field">

              <label htmlFor="department">
                Department
              </label>

              <input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Engineering"
                required
              />

            </div>

          </div>

          <div className="form-grid">

            <div className="form-field">

              <label htmlFor="priority">
                Priority
              </label>

              <select
                id="priority"
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

              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">
                  In Progress
                </option>
                <option value="Pending">Pending</option>
                <option value="Completed">
                  Completed
                </option>
              </select>

            </div>

          </div>

          <div className="form-field">

            <label htmlFor="dueDate">
              Due Date
            </label>

            <input
              id="dueDate"
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
              {submitting ? 'Creating...' : 'Create Task'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default AddTaskModal