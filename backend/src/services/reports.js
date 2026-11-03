/*
 * Reports: each one turns live data into a table.
 *
 *   catalog()            → the list of reports and their filters
 *   runReport(id, query) → { title, columns, rows, totals, ... }
 *
 * Columns carry a "type" (text, date, number, money, percent,
 * status) so the browser can format, total and export them.
 */
import Asset from '../models/Asset.js'
import Attendance from '../models/Attendance.js'
import Department from '../models/Department.js'
import Document from '../models/Document.js'
import Employee from '../models/Employee.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import Task from '../models/Task.js'
import { AppError } from '../middleware/errorHandler.js'
import { expiryState } from './documentRules.js'
import { LEAVE_TYPES, dayKey, startOfToday, todayKey } from './leaveRules.js'
import { MONTH_NAMES } from './payrollRules.js'

const EMPLOYEE_STATUSES = ['Active', 'On Leave', 'Onboarding', 'Inactive']
const WORKED = ['Present', 'Late', 'WFH']

const col = (key, label, type = 'text') => ({ key, label, type })
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null)

/* "2026-10" → { label: "October 2026", from, to } */
function monthOf(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''))
  const today = startOfToday()
  const year = match ? Number(match[1]) : today.getUTCFullYear()
  const month = match ? Number(match[2]) - 1 : today.getUTCMonth()
  if (month < 0 || month > 11) throw new AppError(400, 'Pick a valid month')

  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    label: `${MONTH_NAMES[month]} ${year}`,
    from: new Date(Date.UTC(year, month, 1)),
    to: new Date(Date.UTC(year, month + 1, 0)),
  }
}

/* Last 12 months as filter options, newest first. */
function recentMonths(count = 12) {
  const today = startOfToday()
  return Array.from({ length: count }, (_, index) => {
    const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - index, 1))
    return {
      value: first.toISOString().slice(0, 7),
      label: `${MONTH_NAMES[first.getUTCMonth()]} ${first.getUTCFullYear()}`,
    }
  })
}

const REPORTS = {
  directory: {
    title: 'Employee directory',
    category: 'People',
    description: 'Everyone with their role, department, contract type, manager and joining date.',
    params: (ctx) => [
      { key: 'department', label: 'Department', options: [{ value: '', label: 'All departments' }, ...ctx.departments] },
      { key: 'status', label: 'Status', options: [{ value: '', label: 'All statuses' }, ...EMPLOYEE_STATUSES.map((value) => ({ value, label: value }))] },
    ],
    async run({ department, status }) {
      const filter = {}
      if (department) filter.department = department
      if (status) filter.status = status
      const people = await Employee.find(filter).sort({ department: 1, name: 1 }).lean()

      return {
        columns: [
          col('employeeId', 'ID'), col('name', 'Name'), col('role', 'Role'), col('department', 'Department'),
          col('employmentType', 'Type'), col('status', 'Status', 'status'), col('manager', 'Manager'),
          col('joiningDate', 'Joined', 'date'), col('email', 'Email'),
        ],
        rows: people.map((person) => ({
          employeeId: person.employeeId, name: person.name, role: person.role, department: person.department,
          employmentType: person.employmentType, status: person.status, manager: person.manager || '',
          joiningDate: dayKey(person.joiningDate), email: person.email,
        })),
      }
    },
  },

  headcount: {
    title: 'Headcount by department',
    category: 'People',
    description: 'People per department by status, with each team’s open and completed tasks.',
    params: () => [],
    async run() {
      const [departments, people, tasks] = await Promise.all([
        Department.find().sort({ name: 1 }).lean(),
        Employee.find().lean(),
        Task.find().lean(),
      ])
      const names = [...new Set([...departments.map((d) => d.name), ...people.map((p) => p.department)])].sort()
      const manager = Object.fromEntries(departments.map((d) => [d.name, d.manager || '']))

      const rows = names.map((name) => {
        const team = people.filter((person) => person.department === name)
        const work = tasks.filter((task) => task.department === name)
        const count = (state) => team.filter((person) => person.status === state).length
        return {
          department: name, manager: manager[name] ?? '', people: team.length - count('Inactive'),
          active: count('Active'), onLeave: count('On Leave'), onboarding: count('Onboarding'), inactive: count('Inactive'),
          openTasks: work.filter((task) => task.status !== 'Completed').length,
          completedTasks: work.filter((task) => task.status === 'Completed').length,
        }
      })

      return {
        columns: [
          col('department', 'Department'), col('manager', 'Manager'), col('people', 'People', 'number'),
          col('active', 'Active', 'number'), col('onLeave', 'On leave', 'number'), col('onboarding', 'Onboarding', 'number'),
          col('inactive', 'Left', 'number'), col('openTasks', 'Open tasks', 'number'), col('completedTasks', 'Completed tasks', 'number'),
        ],
        rows,
        totals: ['people', 'active', 'onLeave', 'onboarding', 'inactive', 'openTasks', 'completedTasks'],
      }
    },
  },

  attendance: {
    title: 'Monthly attendance',
    category: 'Time',
    description: 'Days present, working from home, late, absent and on leave per person, with attendance rate.',
    params: () => [{ key: 'month', label: 'Month', options: recentMonths() }],
    async run({ month }) {
      const period = monthOf(month)
      const records = await Attendance.find({ date: { $gte: period.from, $lte: period.to } }).lean()
      const byPerson = new Map()

      for (const record of records) {
        const row = byPerson.get(record.employeeId) || {
          employeeId: record.employeeId, name: record.employeeName, department: record.department,
          Present: 0, WFH: 0, Late: 0, Absent: 0, 'On Leave': 0,
        }
        if (row[record.status] !== undefined) row[record.status] += 1
        byPerson.set(record.employeeId, row)
      }

      const rows = [...byPerson.values()]
        .map((row) => {
          const worked = WORKED.reduce((sum, status) => sum + row[status], 0)
          return {
            employeeId: row.employeeId, name: row.name, department: row.department,
            present: row.Present, wfh: row.WFH, late: row.Late, absent: row.Absent, onLeave: row['On Leave'],
            rate: percent(worked, worked + row.Absent),
          }
        })
        .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name))

      return {
        subtitle: period.label,
        columns: [
          col('employeeId', 'ID'), col('name', 'Name'), col('department', 'Department'), col('present', 'Present', 'number'),
          col('wfh', 'WFH', 'number'), col('late', 'Late', 'number'), col('absent', 'Absent', 'number'),
          col('onLeave', 'On leave', 'number'), col('rate', 'Attendance', 'percent'),
        ],
        rows,
        totals: ['present', 'wfh', 'late', 'absent', 'onLeave'],
      }
    },
  },

  leave: {
    title: 'Leave taken',
    category: 'Time',
    description: 'Approved leave days per person and type for a year, plus requests still waiting.',
    params: () => {
      const year = startOfToday().getUTCFullYear()
      return [{ key: 'year', label: 'Year', options: [year, year - 1, year - 2].map((value) => ({ value: String(value), label: String(value) })) }]
    },
    async run({ year }) {
      const chosen = Number(year) || startOfToday().getUTCFullYear()
      const from = new Date(Date.UTC(chosen, 0, 1))
      const to = new Date(Date.UTC(chosen, 11, 31))
      const leaves = await Leave.find({ from: { $gte: from, $lte: to } }).lean()
      const byPerson = new Map()

      for (const leave of leaves) {
        const row = byPerson.get(leave.employeeId) || {
          employeeId: leave.employeeId, name: leave.employee, department: leave.department,
          ...Object.fromEntries(LEAVE_TYPES.map((type) => [type, 0])), total: 0, pending: 0,
        }
        if (leave.status === 'Approved') {
          row[leave.type] = (row[leave.type] || 0) + (Number(leave.days) || 0)
          row.total += Number(leave.days) || 0
        }
        if (leave.status === 'Pending') row.pending += 1
        byPerson.set(leave.employeeId, row)
      }

      return {
        subtitle: String(chosen),
        columns: [
          col('employeeId', 'ID'), col('name', 'Name'), col('department', 'Department'),
          ...LEAVE_TYPES.map((type) => col(type, type, 'number')),
          col('total', 'Total days', 'number'), col('pending', 'Pending requests', 'number'),
        ],
        rows: [...byPerson.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
        totals: [...LEAVE_TYPES, 'total', 'pending'],
      }
    },
  },

  payroll: {
    title: 'Payroll register',
    category: 'Money',
    description: 'Basic pay, allowances, deductions and net pay per person for one month.',
    params: () => [{ key: 'month', label: 'Month', options: recentMonths() }],
    async run({ month }) {
      const period = monthOf(month)
      const records = await Payroll.find({ month: period.label }).sort({ department: 1, employeeName: 1 }).lean()

      return {
        subtitle: period.label,
        columns: [
          col('employeeId', 'ID'), col('name', 'Name'), col('department', 'Department'), col('basic', 'Basic', 'money'),
          col('allowances', 'Allowances', 'money'), col('deductions', 'Deductions', 'money'), col('net', 'Net pay', 'money'),
          col('type', 'Type'), col('status', 'Status', 'status'),
        ],
        rows: records.map((record) => ({
          employeeId: record.employeeId, name: record.employeeName, department: record.department,
          basic: record.basic, allowances: record.allowances, deductions: record.deductions, net: record.net,
          type: record.type || 'Regular', status: record.status,
        })),
        totals: ['basic', 'allowances', 'deductions', 'net'],
      }
    },
  },

  tasks: {
    title: 'Task status',
    category: 'Work',
    description: 'Tasks with owner, priority, due date and whether they are late.',
    params: () => [{
      key: 'show', label: 'Show',
      options: [
        { value: 'open', label: 'Open tasks' }, { value: 'overdue', label: 'Overdue only' },
        { value: 'completed', label: 'Completed' }, { value: 'all', label: 'All tasks' },
      ],
    }],
    async run({ show = 'open' }) {
      const today = todayKey()
      const tasks = await Task.find().sort({ dueDate: 1 }).lean()
      const late = (task) => task.status !== 'Completed' && task.dueDate && dayKey(task.dueDate) < today
      const keep = {
        open: (task) => task.status !== 'Completed',
        overdue: late,
        completed: (task) => task.status === 'Completed',
        all: () => true,
      }[show] || ((task) => task.status !== 'Completed')

      return {
        columns: [
          col('taskId', 'ID'), col('title', 'Task'), col('assignee', 'Owner'), col('department', 'Department'),
          col('priority', 'Priority', 'status'), col('status', 'Status', 'status'), col('dueDate', 'Due', 'date'), col('late', 'Late?'),
        ],
        rows: tasks.filter(keep).map((task) => ({
          taskId: task.taskId, title: task.title, assignee: task.assignee, department: task.department,
          priority: task.priority, status: task.status, dueDate: dayKey(task.dueDate), late: late(task) ? 'Yes' : '',
        })),
      }
    },
  },

  documents: {
    title: 'Document expiry',
    category: 'Compliance',
    description: 'Documents that have expired or expire soon, so they can be renewed in time.',
    params: () => [{
      key: 'within', label: 'Expiring within',
      options: [{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: '365', label: '1 year' }, { value: 'all', label: 'Any time' }],
    }],
    async run({ within = '90' }) {
      const documents = await Document.find({ expiryDate: { $ne: null } }).sort({ expiryDate: 1 }).lean()
      const limit = within === 'all' ? Infinity : Number(within) || 90
      const today = startOfToday()

      return {
        columns: [
          col('documentId', 'ID'), col('documentName', 'Document'), col('documentType', 'Type'), col('employeeName', 'Employee'),
          col('expiryDate', 'Expires', 'date'), col('daysLeft', 'Days left', 'number'), col('state', 'State', 'status'),
        ],
        rows: documents
          .map((doc) => ({ doc, ...expiryState(doc, today) }))
          .filter((item) => item.state === 'expired' || item.daysLeft <= limit)
          .map(({ doc, state, daysLeft }) => ({
            documentId: doc.documentId, documentName: doc.documentName, documentType: doc.documentType,
            employeeName: doc.employeeName, expiryDate: dayKey(doc.expiryDate), daysLeft,
            state: { expired: 'Expired', expiring: 'Expiring soon', valid: 'Valid' }[state] || state,
          })),
      }
    },
  },

  assets: {
    title: 'Asset register',
    category: 'Compliance',
    description: 'Company equipment, who holds it, its condition and value.',
    params: () => [{
      key: 'status', label: 'Status',
      options: [{ value: '', label: 'All assets' }, ...['Assigned', 'Available', 'Under Maintenance', 'Retired'].map((value) => ({ value, label: value }))],
    }],
    async run({ status }) {
      const assets = await Asset.find(status ? { status } : {}).sort({ category: 1, assetId: 1 }).lean()

      return {
        columns: [
          col('assetId', 'ID'), col('assetName', 'Asset'), col('category', 'Category'), col('status', 'Status', 'status'),
          col('employeeName', 'Held by'), col('condition', 'Condition'), col('purchaseDate', 'Bought', 'date'), col('value', 'Value', 'money'),
        ],
        rows: assets.map((asset) => ({
          assetId: asset.assetId, assetName: asset.assetName, category: asset.category, status: asset.status,
          employeeName: asset.employeeName || '', condition: asset.condition || '',
          purchaseDate: dayKey(asset.purchaseDate), value: Number(asset.value) || 0,
        })),
        totals: ['value'],
      }
    },
  },
}

export async function catalog() {
  const departments = (await Department.find().sort({ name: 1 }).lean()).map((d) => ({ value: d.name, label: d.name }))
  const ctx = { departments }

  return Object.entries(REPORTS).map(([id, report]) => ({
    id,
    title: report.title,
    category: report.category,
    description: report.description,
    params: report.params(ctx),
  }))
}

export async function runReport(id, query = {}) {
  const report = REPORTS[id]
  if (!report) throw new AppError(404, 'There is no such report')

  const result = await report.run(query)
  const rows = result.rows
  const totals = result.totals
    ? Object.fromEntries(result.totals.map((key) => [key, rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)]))
    : null

  return {
    id,
    title: report.title,
    description: report.description,
    subtitle: result.subtitle || '',
    generatedAt: new Date().toISOString(),
    columns: result.columns,
    rows,
    totals,
  }
}
