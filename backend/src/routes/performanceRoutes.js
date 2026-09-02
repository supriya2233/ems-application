import express from 'express'

import {
  getPerformanceRecords,
  getPerformanceById,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from '../controllers/performanceController.js'

const router = express.Router()

router.get('/', getPerformanceRecords)

router.get('/:id', getPerformanceById)

router.post('/', createPerformance)

router.put('/:id', updatePerformance)

router.delete('/:id', deletePerformance)

export default router