import express from 'express'
import {
  getPayroll,
  getPayrollSummary,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getPayrollMonthsHandler,
  generatePayrollHandler,
  recalculatePayrollHandler,
} from '../controllers/payrollController.js'

const router = express.Router()

router.get('/summary', getPayrollSummary)
router.get('/months', getPayrollMonthsHandler)
router.post('/generate', generatePayrollHandler)

router.get('/', getPayroll)
router.post('/', createPayroll)
router.put('/:id', updatePayroll)
router.post('/:id/recalculate', recalculatePayrollHandler)
router.delete('/:id', deletePayroll)

export default router
