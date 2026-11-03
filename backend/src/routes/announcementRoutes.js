import express from 'express'

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../controllers/announcementController.js'

const router = express.Router()

router.get('/', getAnnouncements)
router.post('/', createAnnouncement)
router.put('/:id', updateAnnouncement)
router.delete('/:id', deleteAnnouncement)

export default router
