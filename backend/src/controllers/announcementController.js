import Announcement, { ANNOUNCEMENT_CATEGORIES, EVERYONE } from '../models/Announcement.js'
import { AppError } from '../middleware/errorHandler.js'
import { assignId } from '../services/idService.js'
import { assertDepartmentExists } from '../services/employeeLink.js'
import { publishChange } from '../services/activity.js'
import { escapeRegex } from '../services/activityQuery.js'

// Only these fields can be set from the browser.
const EDITABLE = ['title', 'body', 'category', 'audience', 'pinned']

function pickEditable(input = {}) {
  const body = {}
  for (const field of EDITABLE) {
    if (input[field] !== undefined) body[field] = input[field]
  }
  if (body.pinned !== undefined) body.pinned = Boolean(body.pinned)
  return body
}

async function checkAudience(audience) {
  if (audience === undefined || audience === EVERYONE) return
  await assertDepartmentExists(audience)
}

/*
 * GET /api/announcements?q=holiday&category=Policy&audience=Sales
 * Pinned first, then newest first.
 */
export const getAnnouncements = async (req, res) => {
  const { q = '', category = '', audience = '' } = req.query
  const filter = {}

  if (category) filter.category = category
  if (audience) filter.audience = audience
  if (q.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i')
    filter.$or = [{ title: pattern }, { body: pattern }]
  }

  const data = await Announcement.find(filter).sort({ pinned: -1, publishedAt: -1, _id: -1 }).lean()

  res.status(200).json({ success: true, count: data.length, categories: ANNOUNCEMENT_CATEGORIES, data })
}

export const createAnnouncement = async (req, res) => {
  const body = pickEditable(req.body)
  await checkAudience(body.audience)
  await assignId('announcements', Announcement, body)

  const announcement = await Announcement.create(body)
  publishChange('announcements', 'created', null, announcement)

  res.status(201).json({ success: true, message: 'Announcement posted', data: announcement })
}

export const updateAnnouncement = async (req, res) => {
  const body = pickEditable(req.body)
  const before = await Announcement.findById(req.params.id).lean()
  if (!before) throw new AppError(404, 'Announcement not found')

  await checkAudience(body.audience)

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, body, {
    returnDocument: 'after',
    runValidators: true,
  })
  publishChange('announcements', 'updated', before, announcement)

  res.status(200).json({ success: true, message: 'Announcement updated', data: announcement })
}

export const deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
  if (!announcement) throw new AppError(404, 'Announcement not found')

  await announcement.deleteOne()
  publishChange('announcements', 'deleted', announcement, null)

  res.status(200).json({ success: true, message: 'Announcement deleted' })
}
