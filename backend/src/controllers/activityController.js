import ActivityLog from '../models/ActivityLog.js'

// GET /api/activity?limit=20&module=leave&employeeId=EMP001
export const getActivity = async (req, res) => {
  const filter = {}
  if (req.query.module) filter.module = String(req.query.module)
  if (req.query.employeeId) filter.employeeId = String(req.query.employeeId)

  const limit = Math.min(Number(req.query.limit) || 20, 200)

  const data = await ActivityLog.find(filter).sort({ at: -1 }).limit(limit)

  res.json({ success: true, count: data.length, data })
}
