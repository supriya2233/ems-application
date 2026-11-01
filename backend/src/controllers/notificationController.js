import Notification from '../models/Notification.js'
import { AppError } from '../middleware/errorHandler.js'
import { broadcast } from '../services/liveStream.js'

const unreadCount = () => Notification.countDocuments({ read: false })

// GET /api/notifications?unread=true&limit=50
export const getNotifications = async (req, res) => {
  const filter = req.query.unread === 'true' ? { read: false } : {}
  const limit = Math.min(Number(req.query.limit) || 50, 200)

  const [data, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
    unreadCount(),
  ])

  res.json({ success: true, count: data.length, unreadCount: unread, data })
}

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { returnDocument: 'after' },
  )

  if (!notification) {
    throw new AppError(404, 'Notification not found')
  }

  const unread = await unreadCount()
  // Other open tabs update their bell badge too.
  broadcast('notifications-read', { unreadCount: unread })

  res.json({ success: true, unreadCount: unread, data: notification })
}

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  const result = await Notification.updateMany({ read: false }, { read: true })

  broadcast('notifications-read', { unreadCount: 0 })

  res.json({ success: true, updated: result.modifiedCount, unreadCount: 0 })
}
