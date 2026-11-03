import express from 'express'

import { getAnalytics } from '../controllers/analyticsController.js'
import { catalog, runReport } from '../services/reports.js'

/* Analytics and Reports: read-only views calculated from live data. */

export const analyticsRouter = express.Router()
analyticsRouter.get('/', getAnalytics)

export const reportsRouter = express.Router()

reportsRouter.get('/', async (req, res) => {
  res.status(200).json({ success: true, data: await catalog() })
})

reportsRouter.get('/:id', async (req, res) => {
  res.status(200).json({ success: true, data: await runReport(req.params.id, req.query) })
})
