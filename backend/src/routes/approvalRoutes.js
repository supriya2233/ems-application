import express from 'express'
import { getApprovals } from '../controllers/approvalController.js'

const router = express.Router()

router.get('/', getApprovals)

export default router
