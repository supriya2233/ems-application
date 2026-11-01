import { plural } from './leave'

/* "18 of 21 days · 2 unpaid leave, 1 absent" (from a payroll breakdown) */
export function daysExplained(breakdown) {
  if (!breakdown?.workingDays) return ''
  const reasons = [
    breakdown.notEmployedDays > 0 && `${breakdown.notEmployedDays} not employed`,
    breakdown.unpaidDays > 0 && `${breakdown.unpaidDays} unpaid leave`,
    breakdown.absentDays > 0 && `${breakdown.absentDays} absent`,
  ].filter(Boolean)

  return `${breakdown.payableDays} of ${plural(breakdown.workingDays, 'day')}${reasons.length ? ` · ${reasons.join(', ')}` : ''}`
}

/* "1 person" / "3 people" */
export const people = (count) => `${count} ${count === 1 ? 'person' : 'people'}`
