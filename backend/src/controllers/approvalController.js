import Leave from '../models/Leave.js'
import { getBalances, getCoverage } from '../services/leaveService.js'
import { balanceWarning } from '../services/leaveRules.js'

/*
 * GET /api/approvals
 * Everything waiting for a decision, oldest request first.
 * Each item has a `kind` so later features (onboarding steps,
 * expiring documents) can add their own items to the same inbox.
 */
export const getApprovals = async (req, res) => {
  const pending = await Leave.find({ status: 'Pending' }).sort({ createdAt: 1 }).lean()

  const items = await Promise.all(
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

  res.json({ success: true, count: items.length, data: items })
}
