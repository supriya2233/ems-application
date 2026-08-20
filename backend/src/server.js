import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import employeeRoutes from './routes/employeeRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'

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

const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`EMS backend running on http://localhost:${PORT}`)
  })
}

startServer()