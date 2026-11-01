import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import leaveRoutes from './routes/leaveRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import payrollRoutes from './routes/payrollRoutes.js'
import recruitmentRoutes from './routes/recruitmentRoutes.js'
import onboardingRoutes from './routes/onboardingRoutes.js'
import performanceRoutes from './routes/performanceRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import assetRoutes from './routes/assetRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import approvalRoutes from './routes/approvalRoutes.js'
import offboardingRoutes from './routes/offboardingRoutes.js'
import { startScheduledJobs } from './services/jobs.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { clientContext } from './services/events.js'
import { registerListeners } from './services/listeners.js'
import { streamHandler } from './services/liveStream.js'


dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Remembers which browser tab sent the request (X-Client-Id), so
// that tab can skip the toast for its own action.
app.use(clientContext)

// What happens after a save: activity log, notifications, live push.
registerListeners()

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EMS backend is running',
  })
})

app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/payroll', payrollRoutes)
app.use(
  '/api/recruitment',
  recruitmentRoutes,
)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/performance', performanceRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/offboarding', offboardingRoutes)

// Live updates (Server-Sent Events): one long-lived connection per tab.
app.get('/api/stream', streamHandler)

// Unknown /api URLs get a JSON 404; any thrown error ends up in
// errorHandler, which sends a readable message.
app.use('/api', notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  // Background checks (leave status, overdue onboarding steps):
  // run now, then every hour. See services/jobs.js.
  startScheduledJobs()

  app.listen(PORT, () => {
    console.log(
      `EMS backend running on http://localhost:${PORT}`,
    )
  })
}

startServer()