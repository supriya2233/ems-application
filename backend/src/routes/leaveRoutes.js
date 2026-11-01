import express from 'express'

import {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  previewLeaveHandler,
  getLeaveBalances,
  getLeaveCoverage,
} from '../controllers/leaveController.js'

const router = express.Router()

router.get('/', getLeaves)
// Fixed paths before "/:id" so they aren't read as an id.
router.post('/preview', previewLeaveHandler)
router.get('/balances/:employeeId', getLeaveBalances)
router.get('/:id/coverage', getLeaveCoverage)
router.get('/:id', getLeaveById)
router.post('/', createLeave)
router.put('/:id', updateLeave)
router.delete('/:id', deleteLeave)

export default router
