/*
 * Document expiry rules as pure functions (tested in
 * test/documents.test.js).
 */
import { dayKey, fromDayKey, startOfToday } from './leaveRules.js'

export const EXPIRY_WARNING_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/*
 * expiryState({ expiryDate }, today) →
 *   { state: 'none' }                       no expiry date
 *   { state: 'expired', daysLeft: -3 }      expiry date has passed
 *   { state: 'expiring', daysLeft: 12 }     within the next 30 days (0 = today)
 *   { state: 'valid', daysLeft: 200 }
 * A document is still valid on its expiry date itself.
 */
export function expiryState(document, today = startOfToday()) {
  const expiry = dayKey(document?.expiryDate)
  if (!expiry) return { state: 'none', daysLeft: null }

  const daysLeft = Math.round((fromDayKey(expiry) - fromDayKey(dayKey(today))) / DAY_MS)

  if (daysLeft < 0) return { state: 'expired', daysLeft }
  if (daysLeft <= EXPIRY_WARNING_DAYS) return { state: 'expiring', daysLeft }
  return { state: 'valid', daysLeft }
}

/*
 * Before saving a document:
 *   - an expiry date in the past makes it "Expired"
 *   - renewing it (a future expiry date) turns "Expired" back to "Active"
 *   - changing the expiry date means a new reminder can be sent
 */
export function applyExpiry(body, before = null, today = startOfToday()) {
  const expiryDate = body.expiryDate !== undefined ? body.expiryDate : before?.expiryDate
  const status = body.status ?? before?.status ?? 'Active'
  const { state } = expiryState({ expiryDate }, today)

  if (state === 'expired') body.status = 'Expired'
  else if (status === 'Expired' && expiryDate) body.status = 'Active'

  if (before && body.expiryDate !== undefined && dayKey(body.expiryDate) !== dayKey(before.expiryDate)) {
    body.expiryReminderSentAt = null
  }

  return body
}
