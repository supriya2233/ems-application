import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mergeDepartmentCounts } from '../src/services/departmentStats.js'
import { countBy, summariseLeave } from '../src/services/employeeOverview.js'
import { calculateNet } from '../src/controllers/payrollController.js'
import { errorHandler } from '../src/middleware/errorHandler.js'

test('department counts come from real employees and tasks', () => {
  const departments = [
    { name: 'Engineering', employees: 8 },
    { name: 'Marketing', employees: 25 }, // typed by hand, wrong
  ]
  const employeeGroups = [{ _id: 'Engineering', employees: 1, active: 1 }]
  const taskGroups = [{ _id: 'Marketing', open: 1, completed: 0 }]

  const [engineering, marketing] = mergeDepartmentCounts(departments, employeeGroups, taskGroups)

  assert.equal(engineering.employees, 1)
  assert.equal(engineering.openTasks, 0)
  assert.equal(marketing.employees, 0)
  assert.equal(marketing.openTasks, 1)
})

test('countBy groups records by a field', () => {
  const rows = [{ status: 'Present' }, { status: 'Late' }, { status: 'Present' }]
  assert.deepEqual(countBy(rows, 'status'), { Present: 2, Late: 1 })
})

test('leave summary only counts approved days as taken', () => {
  const summary = summariseLeave([
    { type: 'Annual', days: 3, status: 'Approved' },
    { type: 'Medical', days: 1, status: 'Approved' },
    { type: 'Annual', days: 2, status: 'Pending' },
    { type: 'Casual', days: 5, status: 'Rejected' },
  ])

  assert.deepEqual(summary, {
    approvedDays: 4,
    pendingDays: 2,
    byType: { Annual: 3, Medical: 1 },
  })
})

test('payroll net = basic + allowances - deductions', () => {
  assert.equal(calculateNet({ basic: 65000, allowances: 12000, deductions: 5800 }), 71200)
  assert.equal(calculateNet({ basic: '1000' }), 1000)
})

function fakeResponse() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

test('error handler explains duplicate keys', () => {
  const res = fakeResponse()
  errorHandler({ code: 11000, keyValue: { email: 'a@b.com' } }, {}, res)
  assert.equal(res.statusCode, 409)
  assert.equal(res.body.message, 'A record with email "a@b.com" already exists')
})

test('error handler lists missing required fields', () => {
  const res = fakeResponse()
  errorHandler({
    name: 'ValidationError',
    errors: {
      name: { kind: 'required', path: 'name' },
      role: { kind: 'required', path: 'role' },
    },
  }, {}, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.message, 'name is required, role is required')
})
