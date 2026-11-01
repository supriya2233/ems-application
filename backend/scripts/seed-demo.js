/*
 * Fills a SEPARATE demo database with a realistic company:
 *   npm run seed:demo
 *
 * - Never touches the real database: it only works on a database
 *   whose name contains "demo" (default "ems_demo"), and it wipes
 *   that database first, so it can be run again at any time.
 * - Data goes in through the real API (a temporary backend on the
 *   demo port), so every business rule runs: IDs, leave days,
 *   payroll maths, onboarding checklists, events, notifications.
 *   Only bulk attendance is written directly (a time clock would
 *   not log one activity line per person per day either).
 * - Dates are relative to today, so the demo always looks current.
 * - At the end the history is spread over the last three weeks, so
 *   the activity log reads like a real workspace, not "just now" x 200.
 *
 * Then: npm run demo (backend) + npm run dev:demo (frontend).
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

import { DEMO_MONGO_URI, DEMO_PORT, assertDemoDatabase } from './demo-config.js'
import Attendance from '../src/models/Attendance.js'

const dbName = assertDemoDatabase()
const API = `http://localhost:${DEMO_PORT}/api`
const DAY_MS = 24 * 60 * 60 * 1000

/* ---------------- Small helpers ---------------- */

// Repeatable "random" numbers, so every run builds the same company.
function seededRandom(seed) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
const random = seededRandom(20261101)

const now = new Date()
const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())

/* "YYYY-MM-DD", `offset` days from today */
const day = (offset = 0) => new Date(todayUTC + offset * DAY_MS).toISOString().slice(0, 10)
const weekday = (key) => new Date(`${key}T00:00:00Z`).getUTCDay()
const isWorkday = (key) => weekday(key) >= 1 && weekday(key) <= 5

/* The n-th working day before today (1 = the last one). */
function workdayBefore(n) {
  let offset = 0
  let found = 0
  while (found < n) {
    offset -= 1
    if (isWorkday(day(offset))) found += 1
  }
  return offset
}

/* The next working day on or after `offset`. */
function workdayFrom(offset) {
  while (!isWorkday(day(offset))) offset += 1
  return offset
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthLabel = (monthsAgo) => {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo, 1))
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

async function api(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || result.success === false) {
    throw new Error(`${method} ${path} failed (${response.status}): ${result.message || 'no message'}`)
  }
  return result.data
}

const step = (text) => console.log(`  • ${text}`)

/* ---------------- The company ---------------- */

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', color: 'blue', manager: 'Arjun Mehta', description: 'Builds and runs the product: web, mobile and infrastructure.' },
  { name: 'Design', code: 'DSG', color: 'purple', manager: 'Kavya Iyer', description: 'Product design, research and the design system.' },
  { name: 'Human Resources', code: 'HR', color: 'green', manager: 'Neha Kapoor', description: 'Hiring, onboarding, people operations and payroll.' },
  { name: 'Sales', code: 'SAL', color: 'orange', manager: 'Rohan Das', description: 'New business, partnerships and account management.' },
  { name: 'Finance', code: 'FIN', color: 'yellow', manager: 'Meera Pillai', description: 'Accounting, budgeting and compliance.' },
  { name: 'Operations', code: 'OPS', color: 'red', manager: 'Vikram Singh', description: 'Facilities, IT support and vendor management.' },
]

// name, role, department, type, joined (days ago), basic, allowances, other deductions
const PEOPLE = [
  ['Arjun Mehta', 'Engineering Manager', 'Engineering', 'Full-time', 1460, 120000, 20000, 9500],
  ['Priya Sharma', 'Senior Frontend Engineer', 'Engineering', 'Full-time', 980, 95000, 15000, 7800],
  ['Rahul Verma', 'Backend Engineer', 'Engineering', 'Full-time', 610, 82000, 12000, 6600],
  ['Ananya Rao', 'QA Engineer', 'Engineering', 'Full-time', 400, 60000, 9000, 4800],
  ['Karthik Nair', 'DevOps Engineer', 'Engineering', 'Contract', 220, 78000, 6000, 3900],
  ['Kavya Iyer', 'Design Lead', 'Design', 'Full-time', 1100, 98000, 14000, 8000],
  ['Ishaan Gupta', 'Product Designer', 'Design', 'Full-time', 300, 64000, 9000, 5100],
  ['Neha Kapoor', 'HR Manager', 'Human Resources', 'Full-time', 1300, 85000, 12000, 6900],
  ['Sneha Joshi', 'HR Executive', 'Human Resources', 'Full-time', 150, 42000, 6000, 3100],
  ['Rohan Das', 'Sales Director', 'Sales', 'Full-time', 1500, 110000, 25000, 9800],
  ['Aditya Kulkarni', 'Account Executive', 'Sales', 'Full-time', 520, 55000, 15000, 4700],
  ['Fatima Sheikh', 'Sales Development Rep', 'Sales', 'Part-time', 260, 30000, 5000, 1800],
  ['Meera Pillai', 'Finance Manager', 'Finance', 'Full-time', 900, 90000, 12000, 7400],
  ['Vikram Singh', 'Operations Lead', 'Operations', 'Full-time', 1200, 72000, 10000, 5600],
]

const emailOf = (name) => `${name.toLowerCase().replace(/\s+/g, '.')}@acme-demo.in`
const initialsOf = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

/* ---------------- Server lifecycle ---------------- */

async function startDemoServer() {
  const script = fileURLToPath(new URL('./demo-server.js', import.meta.url))
  const child = spawn(process.execPath, [script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))

  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    if (child.exitCode !== null) break
    try {
      const response = await fetch(`${API}/health`)
      if (response.ok) return child
    } catch {
      // not up yet
    }
  }
  child.kill()
  throw new Error(`The demo backend did not start on port ${DEMO_PORT}.\n${output}`)
}

/* ---------------- Seeding ---------------- */

async function seed() {
  step('Departments')
  for (const department of DEPARTMENTS) await api('POST', '/departments', department)

  step('Employees')
  const employees = {}
  for (const [name, role, department, employmentType, joinedDaysAgo] of PEOPLE) {
    const employee = await api('POST', '/employees', {
      name,
      role,
      department,
      employmentType,
      email: emailOf(name),
      phone: `+91 9${String(Math.floor(random() * 1e9)).padStart(9, '0')}`,
      initials: initialsOf(name),
      status: 'Active',
      joiningDate: day(-joinedDaysAgo),
      manager: DEPARTMENTS.find((item) => item.name === department).manager,
    })
    employees[name] = employee
  }
  const id = (name) => employees[name].employeeId

  step('Payroll from two months ago (processed, the salary baseline)')
  for (const [name, , , , , basic, allowances, deductions] of PEOPLE) {
    await api('POST', '/payroll', {
      employeeId: id(name),
      month: monthLabel(2),
      basic,
      allowances,
      deductions,
      status: 'Processed',
    })
  }

  step('Leave: past, today, unpaid and pending')
  const leave = async (name, type, from, to, reason, decision) => {
    const created = await api('POST', '/leaves', { employeeId: id(name), type, from: day(from), to: day(to), reason })
    if (decision) await api('PUT', `/leaves/${created._id}`, { status: decision })
    return created
  }
  const friday = workdayBefore(1)
  await leave('Priya Sharma', 'Annual', workdayBefore(12), workdayBefore(10), 'Family wedding in Jaipur', 'Approved')
  await leave('Ishaan Gupta', 'Medical', workdayBefore(6), workdayBefore(6), 'Fever', 'Approved')
  await leave('Fatima Sheikh', 'Unpaid', workdayBefore(8), workdayBefore(7), 'Personal travel', 'Approved')
  await leave('Rahul Verma', 'Casual', friday, workdayFrom(1), 'Moving house', 'Approved') // covers today
  await leave('Aditya Kulkarni', 'Annual', workdayBefore(4), workdayBefore(4), 'Long weekend', 'Rejected')
  await leave('Ananya Rao', 'Annual', workdayFrom(9), workdayFrom(11), 'Trip to Goa')
  await leave('Karthik Nair', 'Casual', workdayFrom(4), workdayFrom(4), 'Bank appointment')

  step('Attendance for the last two working weeks')
  const onLeave = new Map() // name → set of day keys, filled by approved leave
  const leaveDays = {
    'Priya Sharma': [12, 11, 10],
    'Ishaan Gupta': [6],
    'Fatima Sheikh': [8, 7],
    'Rahul Verma': [1],
  }
  for (const [name, list] of Object.entries(leaveDays)) onLeave.set(name, new Set(list.map((n) => day(workdayBefore(n)))))

  const rows = []
  for (let n = 1; n <= 10; n++) {
    const key = day(workdayBefore(n))
    for (const [name] of PEOPLE) {
      if (onLeave.get(name)?.has(key)) continue // filled in by the leave approval
      const roll = random()
      const status = roll < 0.78 ? 'Present' : roll < 0.88 ? 'Late' : roll < 0.96 ? 'WFH' : 'Absent'
      const checkIn = status === 'Late' ? `10:${String(5 + Math.floor(random() * 40)).padStart(2, '0')} AM` : `09:${String(Math.floor(random() * 25)).padStart(2, '0')} AM`
      rows.push({
        employeeId: id(name),
        employeeName: name,
        department: employees[name].department,
        date: new Date(`${key}T00:00:00Z`),
        status,
        checkIn: status === 'Absent' ? '' : checkIn,
        checkOut: status === 'Absent' ? '' : `06:${String(Math.floor(random() * 40)).padStart(2, '0')} PM`,
        hours: status === 'Absent' ? '' : `${8 + Math.floor(random() * 2)}h ${Math.floor(random() * 60)}m`,
      })
    }
  }
  await Attendance.insertMany(rows)

  step('Last month’s payroll, generated from salaries, unpaid leave and absences')
  const generated = await api('POST', '/payroll/generate', { month: monthLabel(1) })
  for (const record of generated.created) {
    await api('PUT', `/payroll/${record._id}`, { status: 'Processed' })
  }

  step('Assets')
  const asset = (assetName, category, extra = {}) =>
    api('POST', '/assets', { assetName, category, status: 'Available', condition: 'Good', purchaseCost: 0, ...extra })
  const laptops = []
  for (const model of ['MacBook Pro 14"', 'MacBook Air 13"', 'ThinkPad X1 Carbon', 'Dell XPS 13', 'ThinkPad T14', 'MacBook Pro 16"']) {
    laptops.push(await asset(model, 'Laptop'))
  }
  await asset('Dell UltraSharp 27"', 'Monitor')
  await asset('LG 24" Monitor', 'Monitor')
  await asset('Jabra Evolve2 65', 'Headset')
  await asset('HP LaserJet Pro', 'Printer', { status: 'Under Maintenance', condition: 'Fair' })
  const holders = ['Arjun Mehta', 'Priya Sharma', 'Kavya Iyer', 'Meera Pillai']
  for (const [index, name] of holders.entries()) {
    await api('POST', `/assets/${laptops[index]._id}/assign`, { employeeId: id(name), date: day(-200 + index * 30), condition: 'Good' })
  }

  step('Documents: contracts, an expiring passport, an expired visa, one to verify')
  const document = (name, documentName, documentType, extra = {}) =>
    api('POST', '/documents', { employeeId: id(name), documentName, documentType, issueDate: day(-300), status: 'Active', ...extra })
  for (const name of ['Arjun Mehta', 'Priya Sharma', 'Kavya Iyer', 'Neha Kapoor', 'Rohan Das']) {
    await document(name, 'Employment contract', 'Employment Contract')
  }
  await document('Rohan Das', 'Passport', 'Identity Proof', { expiryDate: day(21) })
  await document('Karthik Nair', 'Work visa', 'Other', { expiryDate: day(-9) })
  await document('Sneha Joshi', 'MBA degree certificate', 'Education Certificate', { status: 'Pending Verification' })

  step('Tasks')
  const task = (title, name, priority, status, dueOffset, description = '') =>
    api('POST', '/tasks', { title, description, assigneeId: id(name), assignee: name, priority, status, dueDate: day(dueOffset) })
  await task('Migrate CI to GitHub Actions', 'Karthik Nair', 'High', 'In Progress', 4, 'Move the build and deploy pipeline off Jenkins.')
  await task('Fix payslip rounding', 'Rahul Verma', 'High', 'To Do', -2, 'Loss of pay shows paise on some payslips.')
  await task('Q4 hiring plan', 'Neha Kapoor', 'Medium', 'Pending', 7, 'Headcount by team, approved by finance.')
  await task('Design system: dark mode tokens', 'Kavya Iyer', 'Medium', 'In Progress', 10)
  await task('Renew office insurance', 'Vikram Singh', 'High', 'To Do', -1)
  await task('Close October books', 'Meera Pillai', 'High', 'Completed', -3)
  await task('Partner deck for Mumbai expo', 'Aditya Kulkarni', 'Low', 'To Do', 12)
  await task('Accessibility audit of onboarding flow', 'Ishaan Gupta', 'Medium', 'Completed', -6)
  await task('Regression suite for leave balances', 'Ananya Rao', 'Medium', 'In Progress', 3)

  step('Performance reviews')
  const review = (name, rating, status, reviewer, strengths) =>
    api('POST', '/performance', {
      employeeId: id(name),
      reviewPeriod: `Q3 ${now.getFullYear()}`,
      reviewDate: day(-20),
      reviewer,
      rating,
      status,
      strengths,
      improvements: 'Delegate more; document decisions.',
      goals: 'Mentor one junior colleague next quarter.',
    })
  await review('Priya Sharma', 5, 'Completed', 'Arjun Mehta', 'Shipped the new dashboard ahead of schedule.')
  await review('Rahul Verma', 4, 'Completed', 'Arjun Mehta', 'Reliable owner of the payroll service.')
  await review('Ishaan Gupta', 4, 'In Review', 'Kavya Iyer', 'Thoughtful research and clean hand-offs.')
  await review('Aditya Kulkarni', 3, 'Draft', 'Rohan Das', 'Strong client relationships.')

  step('Recruitment pipeline and two hires')
  const candidate = (candidateName, position, department, status, appliedOffset, source) =>
    api('POST', '/recruitment', {
      candidateName,
      email: emailOf(candidateName).replace('acme-demo', 'mail'),
      phone: '+91 98000 00000',
      position,
      department,
      experience: `${2 + Math.floor(random() * 6)} years`,
      source,
      appliedDate: day(appliedOffset),
      status,
    })
  await candidate('Divya Menon', 'Frontend Engineer', 'Engineering', 'Applied', -2, 'LinkedIn')
  await candidate('Sameer Khan', 'Sales Development Rep', 'Sales', 'Applied', -1, 'Referral')
  await candidate('Pooja Reddy', 'Data Analyst', 'Finance', 'Screening', -6, 'Naukri')
  await candidate('Harsh Agarwal', 'Backend Engineer', 'Engineering', 'Interview', -12, 'LinkedIn')
  await candidate('Lakshmi Narayan', 'UX Researcher', 'Design', 'Interview', -10, 'Company website')
  await candidate('Manish Tiwari', 'Account Executive', 'Sales', 'Rejected', -20, 'Naukri')
  await candidate('Riya Bose', 'Product Designer', 'Design', 'Selected', -15, 'Dribbble')

  // Hired three days ago, started today-ish: some steps done, one overdue.
  const tanvi = await candidate('Tanvi Desai', 'Mobile Engineer', 'Engineering', 'Selected', -30, 'Referral')
  const hired = await api('POST', `/recruitment/${tanvi._id}/hire`, {
    role: 'Mobile Engineer',
    department: 'Engineering',
    joiningDate: day(-3),
    employmentType: 'Full-time',
    email: 'tanvi.desai@acme-demo.in',
    manager: 'Arjun Mehta',
  })
  const onboardingId = hired.onboarding?._id
  if (onboardingId) {
    await api('PATCH', `/onboarding/${onboardingId}/steps/documents`, { done: true })
    await api('PATCH', `/onboarding/${onboardingId}/steps/systemAccess`, { done: true })
    await api('POST', `/assets/${laptops[4]._id}/assign`, { employeeId: hired.employee.employeeId, condition: 'New' })
    await api('PATCH', `/onboarding/${onboardingId}/steps/equipment`, { done: true })
  }

  // Joining next week.
  const nikhil = await candidate('Nikhil Bansal', 'Finance Analyst', 'Finance', 'Selected', -25, 'LinkedIn')
  await api('POST', `/recruitment/${nikhil._id}/hire`, {
    role: 'Finance Analyst',
    department: 'Finance',
    joiningDate: day(workdayFrom(7)),
    employmentType: 'Full-time',
    email: 'nikhil.bansal@acme-demo.in',
    manager: 'Meera Pillai',
  })

  step('Offboarding: one person leaving soon')
  await api('POST', `/assets/${laptops[5]._id}/assign`, { employeeId: id('Aditya Kulkarni'), date: day(-500), condition: 'Good' })
  const leaving = await api('POST', '/offboarding', {
    employeeId: id('Aditya Kulkarni'),
    lastWorkingDay: day(workdayFrom(10)),
    reason: 'Resignation',
    notes: 'Moving to Bengaluru; handing accounts to Rohan.',
  })
  await api('PATCH', `/offboarding/${leaving._id}/items/exit-interview`, { done: true })
}

/* Spread the history over the last three weeks, oldest first. */
async function spreadHistory() {
  const db = mongoose.connection.db
  const activity = await db.collection('activitylogs').find().sort({ at: 1, _id: 1 }).toArray()
  if (activity.length === 0) return

  const end = Date.now() - 20 * 60 * 1000 // the newest entry: 20 minutes ago
  const start = end - 21 * DAY_MS
  const gap = (end - start) / Math.max(activity.length - 1, 1)

  const times = new Map()
  for (const [index, entry] of activity.entries()) {
    // Office hours look more natural: nudge into 09:00–19:00 IST.
    let at = new Date(start + index * gap)
    const istHour = (at.getUTCHours() + 5.5) % 24
    if (istHour < 9 || istHour >= 19) at = new Date(at.getTime() + ((istHour < 9 ? 9 - istHour : 33 - istHour) % 24) * 60 * 60 * 1000)
    if (at.getTime() > end) at = new Date(end - (activity.length - index) * 1000)
    times.set(entry.eventId, at)
  }

  // Keep the order strictly increasing after the nudges.
  let previous = 0
  const ordered = activity.map((entry) => {
    let at = times.get(entry.eventId).getTime()
    if (at <= previous) at = previous + 60 * 1000
    previous = at
    return { eventId: entry.eventId, at: new Date(Math.min(at, end)) }
  })

  await db.collection('activitylogs').bulkWrite(
    ordered.map(({ eventId, at }) => ({ updateOne: { filter: { eventId }, update: { $set: { at } } } })),
  )

  // Notifications share the event id: same time; older ones read.
  const twoDaysAgo = Date.now() - 2 * DAY_MS
  await db.collection('notifications').bulkWrite(
    ordered.map(({ eventId, at }) => ({
      updateOne: {
        filter: { eventId },
        update: { $set: { createdAt: at, updatedAt: at, read: at.getTime() < twoDaysAgo } },
      },
    })),
  )
}

/* ---------------- Run ---------------- */

async function main() {
  console.log(`Building the demo company in "${dbName}" (port ${DEMO_PORT})…`)

  await mongoose.connect(DEMO_MONGO_URI)
  await mongoose.connection.db.dropDatabase()

  const server = await startDemoServer()
  try {
    await seed()
    // Let the event listeners finish writing activity and notifications.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await spreadHistory()
  } finally {
    server.kill()
  }

  const counts = {}
  for (const name of ['employees', 'leaves', 'attendances', 'payrolls', 'tasks', 'activitylogs', 'notifications']) {
    counts[name] = await mongoose.connection.db.collection(name).countDocuments()
  }
  await mongoose.disconnect()

  console.log('\nDone:', Object.entries(counts).map(([name, count]) => `${count} ${name}`).join(', '))
  console.log('\nStart the demo:')
  console.log('  backend:  cd backend  && npm run demo       (http://localhost:%d)', DEMO_PORT)
  console.log('  frontend: cd frontend && npm run dev:demo')
}

main().catch(async (error) => {
  console.error('\nSeeding failed:', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
