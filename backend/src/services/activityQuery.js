import { AppError } from '../middleware/errorHandler.js'

/*
 * Rules for reading the activity log (pure: no database, easy to test).
 *
 * Filters (all optional, all combined with AND):
 *   module      "leave", "payroll", ...
 *   employeeId  "EMP001"
 *   from, to    ISO date-times; `to` is exclusive. The browser sends
 *               the start of its local day, so "1 Nov" means 1 Nov
 *               where the person is, not in UTC.
 *   q           words to look for in the summary or actor
 *   before      cursor from the previous page (see below)
 *
 * Paging uses a cursor instead of "skip 40 rows": the cursor is the
 * time and id of the last row already shown, and the next page is
 * everything older than it. New events arriving at the top don't
 * shift the pages, so nothing is shown twice or skipped.
 */

export const DEFAULT_PAGE_SIZE = 30
export const MAX_PAGE_SIZE = 100

const OBJECT_ID = /^[a-f0-9]{24}$/i

export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function pageSize(value) {
  const number = Math.floor(Number(value))
  if (!Number.isFinite(number) || number < 1) return DEFAULT_PAGE_SIZE
  return Math.min(number, MAX_PAGE_SIZE)
}

/* The row's position in the "newest first" order, as a string. */
export function encodeCursor(entry) {
  return `${new Date(entry.at).toISOString()}_${entry._id}`
}

export function decodeCursor(cursor) {
  const [at, id] = String(cursor).split('_')
  const date = new Date(at)
  if (!at || Number.isNaN(date.getTime()) || !OBJECT_ID.test(id || '')) {
    throw new AppError(400, 'That page link is no longer valid. Reload the activity log.')
  }
  return { at: date, id }
}

function parseDate(value, name) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `"${value}" is not a valid ${name} date`)
  }
  return date
}

export function buildActivityFilter({ module, employeeId, from, to, q, before } = {}) {
  const conditions = []

  if (module) conditions.push({ module: String(module) })
  if (employeeId) conditions.push({ employeeId: String(employeeId) })

  if (from || to) {
    const at = {}
    if (from) at.$gte = parseDate(from, 'from')
    if (to) at.$lt = parseDate(to, 'to')
    if (at.$gte && at.$lt && at.$gte >= at.$lt) {
      throw new AppError(400, 'The "from" date must be before the "to" date')
    }
    conditions.push({ at })
  }

  const words = String(q || '').trim().split(/\s+/).filter(Boolean).slice(0, 5)
  for (const word of words) {
    const pattern = new RegExp(escapeRegex(word), 'i')
    conditions.push({ $or: [{ summary: pattern }, { actor: pattern }, { employeeId: pattern }] })
  }

  if (before) {
    const cursor = decodeCursor(before)
    // Older than the cursor; rows with the very same time are
    // ordered by id, so ties are not lost between pages.
    conditions.push({ $or: [{ at: { $lt: cursor.at } }, { at: cursor.at, _id: { $lt: cursor.id } }] })
  }

  if (conditions.length === 0) return {}
  if (conditions.length === 1) return conditions[0]
  return { $and: conditions }
}
