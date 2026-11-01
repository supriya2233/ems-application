export const TASK_STATUSES = ['To Do', 'In Progress', 'Pending', 'Completed']
export const TASK_PRIORITIES = ['High', 'Medium', 'Low']

// Badge tone per priority
export const PRIORITY_TONE = { High: 'danger', Medium: 'warning', Low: 'neutral' }

const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/* Past its due date and not finished. */
export const isOverdue = (task, today = startOfToday()) =>
  task.status !== 'Completed' && Boolean(task.dueDate) && new Date(task.dueDate) < today

export const formatDue = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No due date'
