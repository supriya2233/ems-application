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


dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

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
app.use('/api/assets', assetRoutes)

const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  app.listen(PORT, () => {
    console.log(
      `EMS backend running on http://localhost:${PORT}`,
    )
  })
}

startServer()