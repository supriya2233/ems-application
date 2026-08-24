import { useState } from 'react'

function TaskForm({
  onSubmit,
  onCancel,
  submitting = false,
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

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    await onSubmit(formData)
  }

  return (
    <form
      className="task-form"
      onSubmit={handleSubmit}
    >

      <div className="form-group">

        <label htmlFor="taskId">
          Task ID
        </label>

        <input
          id="taskId"
          name="taskId"
          value={formData.taskId}
          onChange={handleChange}
          placeholder="TASK001"
          required
        />

      </div>


      <div className="form-group">

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


      <div className="form-group">

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


      <div className="form-group">

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


      <div className="form-group">

        <label htmlFor="department">
          Department
        </label>

        <input
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          placeholder="Department"
          required
        />

      </div>


      <div className="form-row">

        <div className="form-group">

          <label htmlFor="priority">
            Priority
          </label>

          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Low">
              Low
            </option>
          </select>

        </div>


        <div className="form-group">

          <label htmlFor="status">
            Status
          </label>

          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
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

      </div>


      <div className="form-group">

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


      <div className="form-actions">

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? 'Creating...'
            : 'Create Task'}
        </button>

      </div>

    </form>
  )
}

export default TaskForm