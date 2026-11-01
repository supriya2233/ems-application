import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildActivityFilter,
  decodeCursor,
  encodeCursor,
  escapeRegex,
  pageSize,
} from '../src/services/activityQuery.js'
import { startOfToday, todayKey } from '../src/services/leaveRules.js'
import { expiryState } from '../src/services/documentRules.js'

const ID = '6a0000000000000000000001'

test('no filters reads everything', () => {
  assert.deepEqual(buildActivityFilter({}), {})
  assert.deepEqual(buildActivityFilter(), {})
})

test('one filter is used as-is; several are combined with $and', () => {
  assert.deepEqual(buildActivityFilter({ module: 'leave' }), { module: 'leave' })

  const filter = buildActivityFilter({ module: 'leave', employeeId: 'EMP001' })
  assert.deepEqual(filter, { $and: [{ module: 'leave' }, { employeeId: 'EMP001' }] })
})

test('date range: from is inclusive, to is exclusive', () => {
  const filter = buildActivityFilter({ from: '2026-10-31T18:30:00.000Z', to: '2026-11-01T18:30:00.000Z' })
  assert.equal(filter.at.$gte.toISOString(), '2026-10-31T18:30:00.000Z')
  assert.equal(filter.at.$lt.toISOString(), '2026-11-01T18:30:00.000Z')
})

test('bad or backwards dates are a 400, not a crash', () => {
  assert.throws(() => buildActivityFilter({ from: 'yesterday' }), { status: 400 })
  assert.throws(
    () => buildActivityFilter({ from: '2026-11-02T00:00:00Z', to: '2026-11-01T00:00:00Z' }),
    { status: 400 },
  )
})

test('search words must all match, and are treated as plain text', () => {
  const filter = buildActivityFilter({ q: 'Priya approved' })
  assert.equal(filter.$and.length, 2)
  assert.ok(filter.$and[0].$or[0].summary.test('Leave for priya was approved'))

  // "(" would break a raw regular expression
  assert.equal(escapeRegex('₹1,000 (net)'), '₹1,000 \\(net\\)')
  assert.doesNotThrow(() => buildActivityFilter({ q: '(net' }))
})

test('cursor round-trips and pages strictly older rows, ties by id', () => {
  const entry = { at: new Date('2026-11-01T10:00:00.000Z'), _id: ID }
  const cursor = encodeCursor(entry)
  assert.equal(cursor, `2026-11-01T10:00:00.000Z_${ID}`)
  assert.deepEqual(decodeCursor(cursor), { at: entry.at, id: ID })

  const filter = buildActivityFilter({ before: cursor })
  assert.deepEqual(filter.$or, [
    { at: { $lt: entry.at } },
    { at: entry.at, _id: { $lt: ID } },
  ])
})

test('a tampered cursor is rejected', () => {
  assert.throws(() => decodeCursor('nonsense'), { status: 400 })
  assert.throws(() => decodeCursor('2026-11-01T10:00:00.000Z_notanid'), { status: 400 })
})

test('"today" is the local calendar day, not the UTC one', () => {
  // 00:01 on 2 Nov where the server is: still 1 Nov in UTC for India
  assert.equal(todayKey(new Date(2026, 10, 2, 0, 1)), '2026-11-02')
  assert.equal(todayKey(new Date(2026, 10, 2, 23, 59)), '2026-11-02')
  assert.equal(startOfToday(new Date(2026, 10, 2, 0, 1)).toISOString(), '2026-11-02T00:00:00.000Z')
})

test('day counts just after midnight use the new day', () => {
  // A passport expiring on 20 Nov, checked at 00:30 on 2 Nov: 18 days, not 19
  const today = startOfToday(new Date(2026, 10, 2, 0, 30))
  assert.deepEqual(expiryState({ expiryDate: '2026-11-20' }, today), { state: 'expiring', daysLeft: 18 })
})

test('page size has a default and a ceiling', () => {
  assert.equal(pageSize(undefined), 30)
  assert.equal(pageSize('abc'), 30)
  assert.equal(pageSize(0), 30)
  assert.equal(pageSize(10), 10)
  assert.equal(pageSize(5000), 100)
})
