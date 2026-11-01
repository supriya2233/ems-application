/*
 * "just now", "5 min ago", "3 h ago", "yesterday", "2 Nov"
 */
export function timeAgo(value, now = new Date()) {
  const date = new Date(value)
  const seconds = Math.round((now - date) / 1000)

  if (seconds < 45) return 'just now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'yesterday'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
}
