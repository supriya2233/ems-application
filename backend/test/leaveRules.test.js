import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  balanceWarning,
  calculateBalances,
  countWorkingDays,
  dayKey,
  describeCoverage,
  findOverlap,
  listDays,
  rangesOverlap,
  workingDates,
} from '../src/services/leaveRules.js'

const weekdays = { workingDays: [1, 2, 3, 4, 5], holidays: [] }

// 2026-11-02 is a Monday.

test('a Monday–Friday week is 5 working days', () => {
  assert.equal(countWorkingDays('2026-11-02', '2026-11-06', weekdays), 5)
})

test('weekends are not counted', () => {
  // Friday → Monday = Fri + Mon
  assert.deepEqual(workingDates('2026-11-06', '2026-11-09', weekdays), ['2026-11-06', '2026-11-09'])
  assert.equal(countWorkingDays('2026-11-07', '2026-11-08', weekdays), 0)
})

test('holidays are not counted', () => {
  const settings = { ...weekdays, holidays: [{ date: '2026-11-04', name: 'Festival' }] }
  assert.equal(countWorkingDays('2026-11-02', '2026-11-06', settings), 4)
})

test('ranges across months and custom working weeks', () => {
  // 30 Nov (Mon) → 2 Dec (Wed)
  assert.equal(countWorkingDays('2026-11-30', '2026-12-02', weekdays), 3)
  // Six-day week (Mon–Sat): Mon 2 Nov → Sun 8 Nov
  assert.equal(countWorkingDays('2026-11-02', '2026-11-08', { workingDays: [1, 2, 3, 4, 5, 6] }), 6)
})

test('dates are whole days, whatever form they arrive in', () => {
  assert.equal(dayKey('2026-11-02'), '2026-11-02')
  assert.equal(dayKey(new Date('2026-11-02T00:00:00Z')), '2026-11-02')
  assert.deepEqual(listDays('2026-12-31', '2027-01-01'), ['2026-12-31', '2027-01-01'])
})

test('overlap: sharing even one day counts', () => {
  assert.equal(rangesOverlap('2026-11-02', '2026-11-04', '2026-11-04', '2026-11-06'), true)
  assert.equal(rangesOverlap('2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06'), false)
})

test('findOverlap ignores rejected, cancelled and the request being edited', () => {
  const leaves = [
    { _id: 'a', from: '2026-11-02', to: '2026-11-04', status: 'Rejected' },
    { _id: 'b', from: '2026-11-03', to: '2026-11-03', status: 'Cancelled' },
    { _id: 'c', from: '2026-11-04', to: '2026-11-05', status: 'Pending' },
  ]
  assert.equal(findOverlap(leaves, '2026-11-02', '2026-11-03'), null)
  assert.equal(findOverlap(leaves, '2026-11-05', '2026-11-06')?._id, 'c')
  assert.equal(findOverlap(leaves, '2026-11-05', '2026-11-06', 'c'), null)
})

test('balances: approved is used, pending is shown, unpaid has no limit', () => {
  const leaves = [
    { type: 'Casual', from: '2026-03-02', days: 2, status: 'Approved' },
    { type: 'Casual', from: '2026-05-04', days: 1, status: 'Pending' },
    { type: 'Casual', from: '2026-06-01', days: 3, status: 'Rejected' },
    { type: 'Casual', from: '2025-12-01', days: 4, status: 'Approved' }, // last year
    { type: 'Unpaid', from: '2026-07-01', days: 5, status: 'Approved' },
  ]
  const balances = calculateBalances(leaves, { Casual: 12, Unpaid: null }, 2026)
  const casual = balances.find((b) => b.type === 'Casual')
  const unpaid = balances.find((b) => b.type === 'Unpaid')

  assert.deepEqual(casual, { type: 'Casual', allowance: 12, used: 2, pending: 1, remaining: 10 })
  assert.deepEqual(unpaid, { type: 'Unpaid', allowance: null, used: 5, pending: 0, remaining: null })
})

test('balance warning only when a request goes over', () => {
  const balance = { type: 'Casual', allowance: 12, used: 10, pending: 1, remaining: 2 }
  assert.equal(balanceWarning(balance, 1), '')
  assert.match(balanceWarning(balance, 3), /2 days over Casual leave balance/)
  assert.equal(balanceWarning({ type: 'Unpaid', remaining: null }, 30), '')
})

test('coverage names colleagues already off at the same time', () => {
  const leave = { _id: 'x', employeeId: 'EMP003', department: 'Design', from: '2026-11-12', to: '2026-11-12' }
  const members = [{}, {}, {}]
  const others = [
    { _id: 'a', employeeId: 'EMP001', employee: 'Arjun', status: 'Approved', from: '2026-11-10', to: '2026-11-13' },
    { _id: 'b', employeeId: 'EMP002', employee: 'Priya', status: 'Approved', from: '2026-11-12', to: '2026-11-12' },
    { _id: 'c', employeeId: 'EMP004', employee: 'Meera', status: 'Approved', from: '2026-11-20', to: '2026-11-21' },
  ]

  const coverage = describeCoverage(leave, members, others)
  assert.deepEqual(coverage.othersOff, ['Arjun', 'Priya'])
  assert.equal(coverage.message, '2 of 3 Design team members are already off during this time (Arjun, Priya).')

  assert.equal(describeCoverage(leave, members, []).message, '')
})
