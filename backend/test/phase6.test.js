import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  absentDays,
  calculatePay,
  employedWorkingDays,
  monthBounds,
  monthOf,
  parseMonth,
  payrollMonths,
  unpaidLeaveDays,
} from '../src/services/payrollRules.js'
import {
  buildChecklist,
  deriveOffboardingStatus,
  withAssetItems,
} from '../src/services/offboardingRules.js'
import { applyExpiry, expiryState } from '../src/services/documentRules.js'

const settings = { workingDays: [1, 2, 3, 4, 5], holidays: [] }

/* ---------------- Payroll ---------------- */

test('months: parse, bounds and labels', () => {
  assert.deepEqual(parseMonth('November 2026'), { year: 2026, month: 10 })
  assert.deepEqual(parseMonth('2026-02'), { year: 2026, month: 1 })
  assert.equal(parseMonth('Nonsense 2026'), null)

  assert.deepEqual(monthBounds('February 2028'), { label: 'February 2028', startKey: '2028-02-01', endKey: '2028-02-29' })
  assert.equal(monthOf('2026-11-14T00:00:00Z'), 'November 2026')
})

test('month picker: next month first, and keeps older months that have data', () => {
  const months = payrollMonths(new Date('2026-11-01T10:00:00Z'), ['August 2024', 'garbage'])
  assert.equal(months[0], 'December 2026')
  assert.equal(months[1], 'November 2026')
  assert.equal(months.at(-1), 'August 2024')
  assert.ok(!months.includes('garbage'))
  assert.equal(new Set(months).size, months.length)
})

test('November 2026 has 21 working days; holidays reduce it', () => {
  const nov = monthBounds('November 2026')
  assert.equal(employedWorkingDays(nov, settings).length, 21)
  assert.equal(employedWorkingDays(nov, { ...settings, holidays: [{ date: '2026-11-09' }] }).length, 20)
})

test('joining or leaving mid-month counts only the days employed', () => {
  const nov = monthBounds('November 2026')
  // Joins Monday 16 Nov → 16–30 Nov = 11 working days
  assert.equal(employedWorkingDays(nov, settings, { joiningDate: '2026-11-16' }).length, 11)
  // Last day Friday 13 Nov → 2–13 Nov = 10 working days
  assert.equal(employedWorkingDays(nov, settings, { lastWorkingDay: '2026-11-13' }).length, 10)
  // Joined long ago, still here → whole month
  assert.equal(employedWorkingDays(nov, settings, { joiningDate: '2020-01-01' }).length, 21)
})

test('unpaid leave and absences only count on employed working days, never twice', () => {
  const nov = monthBounds('November 2026')
  const employed = employedWorkingDays(nov, settings)

  const leaves = [
    { type: 'Unpaid', status: 'Approved', from: '2026-11-05', to: '2026-11-09' }, // Thu, Fri, (weekend), Mon = 3
    { type: 'Annual', status: 'Approved', from: '2026-11-20', to: '2026-11-20' }, // paid
    { type: 'Unpaid', status: 'Rejected', from: '2026-11-23', to: '2026-11-23' }, // not approved
  ]
  assert.equal(unpaidLeaveDays(leaves, employed), 3)

  const attendance = [
    { status: 'Absent', date: '2026-11-02' },
    { status: 'Absent', date: '2026-11-02' }, // duplicate entry
    { status: 'Absent', date: '2026-11-06' }, // already unpaid leave
    { status: 'Absent', date: '2026-11-07' }, // Saturday
    { status: 'Present', date: '2026-11-03' },
  ]
  assert.equal(absentDays(attendance, employed, leaves), 1)
})

test('calculatePay: full month, loss of pay, other deductions', () => {
  const full = calculatePay({ basic: 63000, allowances: 0, workingDays: 21 })
  assert.equal(full.net, 63000)
  assert.equal(full.deductions, 0)

  // 2 unpaid days + 1 absence of 21 → 18/21 of 63,000 = 54,000
  const docked = calculatePay({ basic: 50000, allowances: 13000, otherDeductions: 4000, workingDays: 21, unpaidDays: 2, absentDays: 1 })
  assert.equal(docked.gross, 63000)
  assert.equal(docked.breakdown.payableDays, 18)
  assert.equal(docked.breakdown.lossOfPay, 9000)
  assert.equal(docked.net, 50000) // 54,000 − 4,000
  assert.equal(docked.gross - docked.deductions, docked.net) // matches the Payroll model's rule
})

test('calculatePay: pro-rated final settlement and never below zero', () => {
  // Leaves on the 10th working day of 21
  const settlement = calculatePay({ basic: 42000, workingDays: 21, employedDays: 10 })
  assert.equal(settlement.net, 20000)
  assert.equal(settlement.breakdown.notEmployedDays, 11)

  const nothingEarned = calculatePay({ basic: 30000, otherDeductions: 5000, workingDays: 20, employedDays: 2, unpaidDays: 2 })
  assert.equal(nothingEarned.net, 0)
  assert.equal(nothingEarned.breakdown.otherDeductions, 0)
})

/* ---------------- Offboarding ---------------- */

test('offboarding checklist: one return item per asset, then the standard steps', () => {
  const items = buildChecklist([
    { _id: 'a1', assetId: 'AST001', assetName: 'MacBook' },
    { _id: 'a2', assetId: 'AST002', assetName: 'Monitor' },
  ])
  assert.deepEqual(items.map((item) => item.key), [
    'asset-AST001', 'asset-AST002', 'exit-interview', 'handover', 'archive-documents', 'final-settlement',
  ])
  assert.equal(items[0].label, 'Return MacBook (AST001)')
  assert.equal(items[0].assetId, 'a1')
  assert.equal(items.at(-1).kind, 'settlement')
})

test('assets handed over later are added before the standard steps; ticks are kept', () => {
  const items = buildChecklist([{ _id: 'a1', assetId: 'AST001', assetName: 'MacBook' }])
  items[0].done = true

  const updated = withAssetItems(items, [{ _id: 'a9', assetId: 'AST009', assetName: 'Phone' }])
  assert.deepEqual(updated.slice(0, 3).map((item) => item.key), ['asset-AST001', 'asset-AST009', 'exit-interview'])
  assert.equal(updated[0].done, true)

  assert.equal(withAssetItems(items, []), items) // nothing new → same array
})

test('offboarding status follows the checklist', () => {
  const items = buildChecklist([])
  assert.equal(deriveOffboardingStatus(items), 'Not Started')
  items[0].done = true
  assert.equal(deriveOffboardingStatus(items), 'In Progress')
  items.forEach((item) => { item.done = true })
  assert.equal(deriveOffboardingStatus(items), 'Completed')
})

/* ---------------- Documents ---------------- */

test('expiry state: expired, expiring within 30 days, valid, none', () => {
  const today = new Date('2026-11-01T15:00:00Z')
  assert.deepEqual(expiryState({ expiryDate: '2026-10-31' }, today), { state: 'expired', daysLeft: -1 })
  assert.deepEqual(expiryState({ expiryDate: '2026-11-01' }, today), { state: 'expiring', daysLeft: 0 })
  assert.deepEqual(expiryState({ expiryDate: '2026-12-01' }, today), { state: 'expiring', daysLeft: 30 })
  assert.deepEqual(expiryState({ expiryDate: '2026-12-02' }, today), { state: 'valid', daysLeft: 31 })
  assert.deepEqual(expiryState({}, today), { state: 'none', daysLeft: null })
})

test('saving a document: past expiry → Expired, renewal → Active, new date → new reminder', () => {
  const today = new Date('2026-11-01T10:00:00Z')

  assert.equal(applyExpiry({ expiryDate: '2026-10-01', status: 'Active' }, null, today).status, 'Expired')

  const renewed = applyExpiry(
    { expiryDate: '2027-10-01' },
    { status: 'Expired', expiryDate: '2026-10-01', expiryReminderSentAt: new Date() },
    today,
  )
  assert.equal(renewed.status, 'Active')
  assert.equal(renewed.expiryReminderSentAt, null)

  // Untouched expiry date: reminder state left alone, status kept
  const notes = applyExpiry({ notes: 'x' }, { status: 'Pending Verification', expiryDate: '2027-01-01' }, today)
  assert.equal(notes.status, undefined)
  assert.equal('expiryReminderSentAt' in notes, false)
})
