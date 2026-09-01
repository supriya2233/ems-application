import express from 'express'

import {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
} from '../controllers/leaveController.js'

const router = express.Router()

router.get('/', getLeaves)
router.get('/:id', getLeaveById)
router.post('/', createLeave)
router.put('/:id', updateLeave)
router.delete('/:id', deleteLeave)

export default router