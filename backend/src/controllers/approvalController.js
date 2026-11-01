import Leave from '../models/Leave.js'
import { getBalances, getCoverage } from '../services/leaveService.js'
import { balanceWarning } from '../services/leaveRules.js'
import { getOverdueSteps } from '../services/onboardingService.js'
import { getDocumentAlerts } from '../services/documentService.js'

const documentSummary = (document) => ({
  _id: document._id,
  documentId: document.documentId,
  documentName: document.documentName,
  documentType: document.documentType,
  employeeId: document.employeeId,
  employeeName: document.employeeName,
  expiryDate: document.expiryDate,
  status: document.status,
})

/*
 * GET /api/approvals
 * Everything waiting for a decision or action, oldest first.
 * Each item has a `kind`:
 *   leave            a pending leave request (approve / reject)
 *   onboarding-step  an overdue onboarding checklist step (mark done)
 *   document-expiry  a document expired or expiring within 30 days (renew)
 *   document-verify  a document waiting for verification (verify)
 */
export const getApprovals = async (req, res) => {
  const pending = await Leave.find({ status: 'Pending' }).sort({ createdAt: 1 }).lean()

  const leaveItems = await Promise.all(
    pending.map(async (leave) => {
      const year = new Date(leave.from).getUTCFullYear()

      const [balances, coverage] = await Promise.all([
        getBalances(leave.employeeId, year, { excludeId: leave._id }),
        getCoverage(leave),
      ])

      const balance = balances.find((item) => item.type === leave.type) || null
      const warnings = [balanceWarning(balance, leave.days), coverage.message].filter(Boolean)

      return {
        kind: 'leave',
        id: String(leave._id),
        requestedAt: leave.createdAt,
        leave,
        balance,
        coverage,
        warnings,
      }
    }),
  )

  const overdue = await getOverdueSteps()

  const onboardingItems = overdue.map(({ record, step }) => ({
    kind: 'onboarding-step',
    id: `${record._id}-${step.key}`,
    requestedAt: step.dueDate, // "waiting since" the due date
    onboarding: {
      _id: record._id,
      onboardingId: record.onboardingId,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      joiningDate: record.joiningDate,
    },
    step,
  }))

  const { expiry, unverified } = await getDocumentAlerts()

  // Expired / expiring: "waiting since" the start of the 30-day warning
  // (expired ones since their expiry date), so the oldest come first.
  const expiryItems = expiry.map(({ document, state, daysLeft }) => ({
    kind: 'document-expiry',
    id: `document-expiry-${document._id}`,
    requestedAt:
      state === 'expired'
        ? document.expiryDate
        : new Date(new Date(document.expiryDate).getTime() - 30 * 24 * 60 * 60 * 1000),
    document: documentSummary(document),
    state,
    daysLeft,
  }))

  const verifyItems = unverified.map((document) => ({
    kind: 'document-verify',
    id: `document-verify-${document._id}`,
    requestedAt: document.createdAt,
    document: documentSummary(document),
  }))

  const items = [...leaveItems, ...onboardingItems, ...expiryItems, ...verifyItems].sort(
    (a, b) => new Date(a.requestedAt) - new Date(b.requestedAt),
  )

  res.json({ success: true, count: items.length, data: items })
}
