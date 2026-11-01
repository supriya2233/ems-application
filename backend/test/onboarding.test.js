import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  applyChecklist,
  deriveStatus,
  dueDatesFor,
  overdueSteps,
} from '../src/services/onboardingRules.js'
import { nextHistory } from '../src/services/assetService.js'
import { hireDetails } from '../src/services/hiringService.js'

const key = (date) => new Date(date).toISOString().slice(0, 10)

test('due dates follow the joining date', () => {
  const due = dueDatesFor('2026-11-16')
  assert.equal(key(due.documents), '2026-11-13') // 3 days before
  assert.equal(key(due.systemAccess), '2026-11-16')
  assert.equal(key(due.equipment), '2026-11-16')
  assert.equal(key(due.orientation), '2026-11-18') // 2 days after
})

test('status follows the checklist', () => {
  assert.equal(deriveStatus({}), 'Not Started')
  assert.equal(deriveStatus({ documents: true }), 'In Progress')
  assert.equal(
    deriveStatus({ documents: true, orientation: true, equipment: true, systemAccess: true }),
    'Completed',
  )
})

test('applyChecklist stamps completion and ignores a status from the browser', () => {
  const now = new Date('2026-11-02T10:00:00Z')
  const before = { joiningDate: '2026-11-16', documents: false, stepCompletedAt: {} }

  const result = applyChecklist({ documents: true, status: 'Completed' }, before, now)
  assert.equal(result.status, 'In Progress')
  assert.equal(result.stepCompletedAt.documents, now)
  assert.equal(result.stepDueDates, undefined) // joining date unchanged

  const undone = applyChecklist({ documents: false }, { ...before, documents: true, stepCompletedAt: { documents: now } }, now)
  assert.equal(undone.stepCompletedAt.documents, undefined)
  assert.equal(undone.status, 'Not Started')
})

test('changing the joining date moves the due dates', () => {
  const result = applyChecklist({ joiningDate: '2026-12-01' }, { joiningDate: '2026-11-16' })
  assert.equal(key(result.stepDueDates.systemAccess), '2026-12-01')
  assert.deepEqual(result.overdueNotified, [])
})

test('overdue = not done and due before today', () => {
  const record = { joiningDate: '2026-11-16', documents: true, systemAccess: false, equipment: false, orientation: false }
  const today = new Date('2026-11-17T09:00:00Z')

  assert.deepEqual(
    overdueSteps(record, today).map((step) => step.key),
    ['systemAccess', 'equipment'], // documents done; orientation due 18th
  )
  assert.deepEqual(overdueSteps(record, new Date('2026-11-16T09:00:00Z')).map((s) => s.key), [])
})

test('asset history: assign, reassign, return', () => {
  const t1 = new Date('2026-01-01')
  const t2 = new Date('2026-02-01')
  const t3 = new Date('2026-03-01')

  let history = nextHistory([], null, { employeeId: 'EMP001', employeeName: 'Arjun', condition: 'New', assignedDate: t1 })
  assert.equal(history.length, 1)
  assert.equal(history[0].returnedAt, undefined)

  history = nextHistory(history, { employeeId: 'EMP001' }, { employeeId: 'EMP002', employeeName: 'Priya', condition: 'Good', assignedDate: t2 }, { at: t2 })
  assert.equal(history.length, 2)
  assert.equal(history[0].returnedAt, t2)
  assert.equal(history[0].conditionIn, 'Good')

  history = nextHistory(history, { employeeId: 'EMP002' }, { employeeId: '', condition: 'Fair' }, { at: t3, note: 'Screen scratched' })
  assert.equal(history.length, 2)
  assert.equal(history[1].returnedAt, t3)
  assert.equal(history[1].note, 'Screen scratched')

  const same = nextHistory(history, { employeeId: '' }, { employeeId: '' })
  assert.equal(same, history) // nothing changed hands
})

test('hire form: defaults from the candidate, and checks', () => {
  const candidate = { candidateName: 'Meera Nair', position: 'Designer', department: 'Designing', email: 'MEERA@mail.com' }
  const details = hireDetails(candidate, { joiningDate: '2026-11-16' })

  assert.equal(details.role, 'Designer')
  assert.equal(details.email, 'meera@mail.com')
  assert.equal(details.employmentType, 'Full-time')
  assert.equal(key(details.joiningDate), '2026-11-16')

  assert.throws(() => hireDetails(candidate, {}), /joining date/)
  assert.throws(() => hireDetails(candidate, { joiningDate: '2026-11-16', email: 'nope' }), /valid work email/)
  assert.throws(() => hireDetails(candidate, { joiningDate: '2026-11-16', employmentType: 'Freelance' }), /Employment type/)
})
