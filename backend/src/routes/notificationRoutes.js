import express from 'express'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js'

const router = express.Router()

router.get('/', getNotifications)
// "read-all" must come before "/:id/..." style routes that could match it.
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)

export default router
