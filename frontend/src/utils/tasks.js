import { toInputDate, todayKey } from './leave'

export const TASK_STATUSES =['To Do', 'In Progress', 'Pending', 'Completed']
export const TASK_PRIORITIES = ['High', 'Medium', 'Low']

// Badge tone per priority
export const PRIORITY_TONE = { High: 'danger', Medium: 'warning', Low: 'neutral' }

/*
 * Due before today and not finished. Compares calendar days: a due
 * date is stored as that day at UTC midnight, today is the user's own.
 */
export const isOverdue = (task, today = todayKey()) =>
  task.status !== 'Completed' && Boolean(task.dueDate) && toInputDate(task.dueDate) < today

export const formatDue = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No due date'
