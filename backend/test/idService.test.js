import { test } from 'node:test'
import assert from 'node:assert/strict'

import { formatId, highestNumber } from '../src/services/idService.js'

test('formatId pads to at least three digits', () => {
  assert.equal(formatId('EMP', 7), 'EMP007')
  assert.equal(formatId('TASK', 42), 'TASK042')
  assert.equal(formatId('EMP', 1234), 'EMP1234')
})

test('highestNumber finds the largest ID with the same prefix', () => {
  assert.equal(highestNumber(['EMP001', 'EMP010', 'EMP003'], 'EMP'), 10)
})

test('highestNumber ignores other prefixes and odd values', () => {
  // "MKG001" was typed by hand for Marketing; it must not count as DEP.
  assert.equal(highestNumber(['DEP001', 'MKG001', null, '', 'DEP00X'], 'DEP'), 1)
  assert.equal(highestNumber([], 'DEP'), 0)
})

test('after a delete the next ID is never reused', () => {
  // EMP002 was deleted. The old "count + 1" rule gave EMP003 again.
  const remaining = ['EMP001', 'EMP003']
  const next = formatId('EMP', highestNumber(remaining, 'EMP') + 1)

  assert.equal(next, 'EMP004')
  assert.notEqual(next, formatId('EMP', remaining.length + 1))
})
