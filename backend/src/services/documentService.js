import Document from '../models/Document.js'
import { publishChange } from './activity.js'
import { publish } from './events.js'
import { dayKey, fromDayKey, startOfToday } from './leaveRules.js'
import { EXPIRY_WARNING_DAYS, expiryState } from './documentRules.js'

const DAY_MS = 24 * 60 * 60 * 1000

const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

const inDays = (count) => (count === 0 ? 'today' : count === 1 ? 'tomorrow' : `in ${count} days`)

/*
 * Scheduled job (hourly, see jobs.js):
 *   1. documents past their expiry date become "Expired"
 *   2. documents expiring within 30 days get one reminder
 * Returns how many documents it acted on.
 */
export async function checkDocumentExpiry(today = startOfToday()) {
  const todayStart = fromDayKey(dayKey(today))
  const warnUntil = new Date(todayStart.getTime() + EXPIRY_WARNING_DAYS * DAY_MS)
  let count = 0

  const expired = await Document.find({ expiryDate: { $lt: todayStart }, status: { $ne: 'Expired' } }).lean()

  for (const before of expired) {
    const after = await Document.findByIdAndUpdate(before._id, { status: 'Expired' }, { returnDocument: 'after' }).lean()
    publishChange('documents', 'updated', before, after, { actor: 'System', notify: false })

    publish({
      actor: 'System',
      type: 'documents.expired',
      module: 'documents',
      action: 'expired',
      summary: `“${after.documentName}” for ${after.employeeName} expired on ${formatDay(after.expiryDate)}`,
      employeeId: after.employeeId,
      entityId: String(after._id),
      link: '/approvals',
      notify: {
        title: 'Document expired',
        message: `${after.employeeName}’s ${after.documentType} “${after.documentName}” expired on ${formatDay(after.expiryDate)}. Upload a renewed copy.`,
        tone: 'warning',
      },
    })
    count += 1
  }

  const expiring = await Document.find({
    expiryDate: { $gte: todayStart, $lte: warnUntil },
    status: { $ne: 'Expired' },
    expiryReminderSentAt: null,
  }).lean()

  for (const document of expiring) {
    const { daysLeft } = expiryState(document, today)
    await Document.updateOne({ _id: document._id }, { expiryReminderSentAt: new Date() })

    publish({
      actor: 'System',
      type: 'documents.expiring',
      module: 'documents',
      action: 'expiring',
      summary: `“${document.documentName}” for ${document.employeeName} expires ${inDays(daysLeft)}`,
      employeeId: document.employeeId,
      entityId: String(document._id),
      link: '/approvals',
      notify: {
        title: 'Document expiring soon',
        message: `${document.employeeName}’s ${document.documentType} “${document.documentName}” expires ${inDays(daysLeft)} (${formatDay(document.expiryDate)}).`,
        tone: 'warning',
      },
    })
    count += 1
  }

  return count
}

/*
 * Documents that need someone (Approvals inbox and dashboard):
 *   expired / expiring within 30 days, and unverified ones.
 */
export async function getDocumentAlerts(today = startOfToday()) {
  const warnUntil = new Date(fromDayKey(dayKey(today)).getTime() + EXPIRY_WARNING_DAYS * DAY_MS)

  const [dated, unverified] = await Promise.all([
    Document.find({ expiryDate: { $ne: null, $lte: warnUntil } }).sort({ expiryDate: 1 }).lean(),
    Document.find({ status: 'Pending Verification' }).sort({ createdAt: 1 }).lean(),
  ])

  const expiry = dated
    .map((document) => ({ document, ...expiryState(document, today) }))
    .filter((item) => item.state === 'expired' || item.state === 'expiring')

  return { expiry, unverified }
}
