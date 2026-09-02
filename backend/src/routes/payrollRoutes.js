import express from 'express'
import {
  getPayroll,
  getPayrollSummary,
  createPayroll,
  updatePayroll,
  deletePayroll,
} from '../controllers/payrollController.js'

const router = express.Router()

router.get(
  '/summary',
  getPayrollSummary,
)

router.get(
  '/',
  getPayroll,
)

router.post(
  '/',
  createPayroll,
)

router.put(
  '/:id',
  updatePayroll,
)

router.delete(
  '/:id',
  deletePayroll,
)

export default router