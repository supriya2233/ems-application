import { test } from 'node:test'
import assert from 'node:assert/strict'

import { describeChange, MODULE_NAMES } from '../src/services/describe.js'
import { formatSSE } from '../src/services/liveStream.js'
import { bus, publish, requestContext } from '../src/services/events.js'

const leave = {
  _id: 'L1', employeeId: 'EMP002', employee: 'Priya Sharma', type: 'Sick',
  days: 2, from: '2026-11-03', to: '2026-11-04', status: 'Pending',
}

test('a new leave request asks for review', () => {
  const event = describeChange('leave', 'created', null, leave)
  assert.equal(event.type, 'leave.requested')
  assert.equal(event.employeeId, 'EMP002')
  assert.equal(event.notify.tone, 'warning')
  assert.match(event.notify.message, /Priya Sharma asked for 2 days of Sick leave/)
})

test('approving leave is a notified event', () => {
  const event = describeChange('leave', 'updated', leave, { ...leave, status: 'Approved' })
  assert.equal(event.type, 'leave.approved')
  assert.equal(event.notify.title, 'Leave approved')
  assert.equal(event.notify.tone, 'success')
})

test('an edit that changes nothing important is activity only', () => {
  const event = describeChange('leave', 'updated', leave, { ...leave, reason: 'Fever' })
  assert.equal(event.type, 'leave.updated')
  assert.equal(event.notify, null)
  assert.match(event.summary, /Updated Priya Sharma’s Sick leave/)
})

test('completing a task notifies; other status moves do not', () => {
  const task = { _id: 'T1', title: 'Brand promo', assignee: 'Arjun', assigneeId: 'EMP001', status: 'In Progress' }
  const done = describeChange('tasks', 'updated', task, { ...task, status: 'Completed' })
  assert.equal(done.type, 'tasks.completed')
  assert.ok(done.notify)

  const moved = describeChange('tasks', 'updated', { ...task, status: 'Pending' }, task)
  assert.equal(moved.type, 'tasks.status-changed')
  assert.equal(moved.notify, null)
})

test('deletes are described for every module', () => {
  for (const module of MODULE_NAMES) {
    const event = describeChange(module, 'deleted', { _id: 'x' }, null)
    assert.equal(event.action, 'deleted')
    assert.match(event.summary, /^Deleted /)
  }
})

test('formatSSE writes one SSE message', () => {
  assert.equal(formatSSE('activity', { a: 1 }), 'event: activity\ndata: {"a":1}\n\n')
})

test('publish stamps id, time, actor and the calling tab', () => {
  let received
  const listener = (event) => { received = event }
  bus.on('domain-event', listener)
  requestContext.run({ clientId: 'tab-1' }, () => publish({ type: 'x.created' }))
  bus.off('domain-event', listener)

  assert.equal(received.type, 'x.created')
  assert.equal(received.actor, 'Administrator')
  assert.equal(received.clientId, 'tab-1')
  assert.ok(received.id && received.at)
})
