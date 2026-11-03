import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  attendanceSummary,
  attritionRate,
  averageTenure,
  countBy,
  headcountTrend,
  leaveByMonth,
  leavingDates,
  monthRange,
  payrollByMonth,
  tasksByDepartment,
} from '../src/services/analyticsRules.js'
import { describeChange } from '../src/services/describe.js'

const TODAY = new Date('2026-11-03T00:00:00Z')
const SETTINGS = { workingDays: [1, 2, 3, 4, 5], holidays: [] }

test('monthRange gives the last N months, oldest first, with day bounds', () => {
  const months = monthRange(TODAY, 3)
  assert.deepEqual(months.map((m) => m.key), ['2026-09', '2026-10', '2026-11'])
  assert.equal(months[1].endKey, '2026-10-31')
  assert.equal(months[0].label, 'Sep 26')
  assert.equal(months[2].long, 'November 2026')
  // Crossing a year boundary
  assert.equal(monthRange(new Date('2026-01-15T00:00:00Z'), 2)[0].key, '2025-12')
})

test('headcount counts people employed at each month end; hires and exits per month', () => {
  const people = [
    { employeeId: 'E1', joiningDate: '2025-01-10', status: 'Active' },
    { employeeId: 'E2', joiningDate: '2026-10-05', status: 'Active' },
    { employeeId: 'E3', joiningDate: '2024-05-01', status: 'Inactive' },
  ]
  const left = leavingDates(people, [{ employeeId: 'E3', status: 'Completed', lastWorkingDay: '2026-10-20' }])
  const trend = headcountTrend(people, left, monthRange(TODAY, 3))

  assert.deepEqual(trend.map((m) => m.headcount), [2, 2, 2]) // Sep: E1+E3, Oct: E1+E2 (E3 left), Nov: E1+E2
  assert.deepEqual(trend.map((m) => m.hires), [0, 1, 0])
  assert.deepEqual(trend.map((m) => m.exits), [0, 1, 0])
  assert.equal(attritionRate(trend), 50) // 1 exit / average headcount 2
})

test('an open offboarding is not an exit yet', () => {
  const left = leavingDates(
    [{ employeeId: 'E1', joiningDate: '2025-01-10', status: 'Active' }],
    [{ employeeId: 'E1', status: 'In Progress', lastWorkingDay: '2026-11-20' }],
  )
  assert.equal(left.size, 0)
})

test('leave is counted in working days and split across months', () => {
  const leaves = [
    // Thu 29 Oct – Tue 3 Nov: Oct 29, 30 + Nov 2, 3 = 4 working days
    { status: 'Approved', type: 'Annual', from: '2026-10-29', to: '2026-11-03' },
    { status: 'Pending', type: 'Casual', from: '2026-10-12', to: '2026-10-12' },
  ]
  const rows = leaveByMonth(leaves, monthRange(TODAY, 2), SETTINGS, ['Annual', 'Casual'])
  assert.deepEqual(rows.map((r) => [r.month, r.Annual, r.Casual, r.total]), [
    ['2026-10', 2, 0, 2],
    ['2026-11', 2, 0, 2],
  ])
})

test('attendance rate counts present, late and WFH against absences, not leave', () => {
  const summary = attendanceSummary(
    ['Present', 'Present', 'WFH', 'Late', 'Absent', 'On Leave'].map((status) => ({ status })),
    ['Present', 'WFH', 'Late', 'Absent', 'On Leave'],
  )
  assert.equal(summary.rate, 80) // 4 worked of 5 expected
  assert.equal(summary.marked, 6)
  assert.equal(attendanceSummary([], ['Present']).rate, null)
})

test('payroll, departments, tasks and tenure', () => {
  const months = monthRange(TODAY, 2)
  const payroll = payrollByMonth(
    [{ month: 'October 2026', net: 1000, employeeId: 'E1' }, { month: 'October 2026', net: 500, employeeId: 'E2' }],
    months,
  )
  assert.deepEqual(payroll.map((m) => [m.month, m.net, m.people]), [['2026-10', 1500, 2], ['2026-11', 0, 0]])

  assert.deepEqual(
    countBy([{ department: 'Sales' }, { department: 'HR' }, { department: 'Sales' }], 'department'),
    [{ name: 'Sales', count: 2 }, { name: 'HR', count: 1 }],
  )
  assert.deepEqual(countBy([{ t: 'A' }], 't', ['A', 'B']), [{ name: 'A', count: 1 }, { name: 'B', count: 0 }])

  const tasks = tasksByDepartment([
    { department: 'Sales', status: 'To Do', dueDate: '2026-11-01' },
    { department: 'Sales', status: 'Completed', dueDate: '2026-10-01' },
    { department: 'Sales', status: 'In Progress', dueDate: '2026-11-03' }, // due today: not late
  ], '2026-11-03')
  assert.deepEqual(tasks, [{ name: 'Sales', open: 2, overdue: 1, completed: 1, total: 3 }])

  assert.equal(averageTenure([{ status: 'Active', joiningDate: '2024-11-03' }, { status: 'Inactive', joiningDate: '2000-01-01' }], '2026-11-03'), 2)
})

test('announcements are described for the activity log and notify', () => {
  const doc = { _id: '1', title: 'Office closed on Friday', audience: 'Everyone', pinned: false }
  const created = describeChange('announcements', 'created', null, doc)
  assert.equal(created.summary, 'Posted “Office closed on Friday” for everyone')
  assert.equal(created.notify.title, 'New announcement')

  const pinned = describeChange('announcements', 'updated', doc, { ...doc, pinned: true })
  assert.equal(pinned.type, 'announcements.pinned')
  assert.equal(describeChange('announcements', 'created', null, { ...doc, audience: 'Sales' }).summary.endsWith('for Sales'), true)
})
