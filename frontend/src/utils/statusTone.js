/*
 * One place that decides which colour ("tone") a status gets.
 *
 * Every module has its own status words (Approved, Present,
 * Hired, Available, ...). Mapping them here means the same
 * meaning always looks the same, on every page.
 *
 * Tones (styled in styles/components.css):
 *   success  – done / good / available
 *   info     – in progress / under way
 *   warning  – waiting for someone / needs a look
 *   danger   – failed / rejected / overdue
 *   neutral  – not started / informational
 */

export const TONES = ['success', 'info', 'warning', 'danger', 'neutral']

const STATUS_TONES = {
  // success
  active: 'success',
  approved: 'success',
  completed: 'success',
  present: 'success',
  processed: 'success',
  paid: 'success',
  available: 'success',
  hired: 'success',
  selected: 'success',
  verified: 'success',
  excellent: 'success',
  good: 'success',
  new: 'success',
  published: 'success',

  // info
  'in progress': 'info',
  'in review': 'info',
  interview: 'info',
  assigned: 'info',
  wfh: 'info',
  'work from home': 'info',
  remote: 'info',
  applied: 'info',

  // warning
  pending: 'warning',
  'pending verification': 'warning',
  'on leave': 'warning',
  late: 'warning',
  'half day': 'warning',
  screening: 'warning',
  'under maintenance': 'warning',
  fair: 'warning',
  medium: 'warning',
  draft: 'warning',

  // danger
  rejected: 'danger',
  absent: 'danger',
  expired: 'danger',
  overdue: 'danger',
  cancelled: 'danger',
  damaged: 'danger',
  lost: 'danger',
  poor: 'danger',
  high: 'danger',
  urgent: 'danger',
  critical: 'danger',

  // neutral
  'to do': 'neutral',
  'not started': 'neutral',
  inactive: 'neutral',
  retired: 'neutral',
  low: 'neutral',
}

/* getStatusTone('On Leave') → 'warning'; unknown words → 'neutral' */
export function getStatusTone(status) {
  const key = String(status ?? '').trim().toLowerCase()

  return STATUS_TONES[key] || 'neutral'
}
