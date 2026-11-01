import express from 'express'
import { getActivity, getActivityModules } from '../controllers/activityController.js'

const router = express.Router()

router.get('/', getActivity)
router.get('/modules', getActivityModules)

export default router
