import ActivityLog from '../models/ActivityLog.js'
import { buildActivityFilter, encodeCursor, pageSize } from '../services/activityQuery.js'

/*
 * GET /api/activity
 *   ?limit=30&module=leave&employeeId=EMP001
 *   &from=<ISO>&to=<ISO>&q=approved&before=<cursor>
 *
 * Newest first. `nextCursor` is passed back as `before` to get the
 * next (older) page; it is null when there is nothing older.
 */
export const getActivity = async (req, res) => {
  const limit = pageSize(req.query.limit || 20)
  const filter = buildActivityFilter(req.query)

  // One extra row tells us whether another page exists.
  const rows = await ActivityLog.find(filter).sort({ at: -1, _id: -1 }).limit(limit + 1).lean()

  const hasMore = rows.length > limit
  const data = rows.slice(0, limit)

  res.json({
    success: true,
    count: data.length,
    data,
    hasMore,
    nextCursor: hasMore ? encodeCursor(data.at(-1)) : null,
  })
}

/*
 * GET /api/activity/modules
 * Which modules have history, with how many entries each
 * (for the filter on the Activity log page).
 */
export const getActivityModules = async (req, res) => {
  const groups = await ActivityLog.aggregate([
    { $group: { _id: '$module', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  res.json({
    success: true,
    data: groups.map((group) => ({ module: group._id, count: group.count })),
  })
}
