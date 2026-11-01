import { test } from 'node:test'
import assert from 'node:assert/strict'

import Leave from '../src/models/Leave.js'
import Document from '../src/models/Document.js'
import Asset from '../src/models/Asset.js'
import { getLink, linkEmployee, snapshotFields } from '../src/services/employeeLink.js'

const priya = { employeeId: 'EMP002', name: 'Priya Sharma', department: 'Design' }

test('snapshot copies name and department under each module’s field names', () => {
  assert.deepEqual(snapshotFields(priya, getLink(Leave)), {
    employee: 'Priya Sharma',
    department: 'Design',
  })
})

test('snapshot skips department for modules that do not store it', () => {
  assert.deepEqual(snapshotFields(priya, getLink(Document)), {
    employeeName: 'Priya Sharma',
  })
})

test('creating a record without an employee is rejected', async () => {
  await assert.rejects(
    () => linkEmployee({ documentName: 'Offer letter' }, getLink(Document)),
    { status: 400, message: 'Please select an employee' },
  )
})

test('an update that does not touch the employee is left alone', async () => {
  const body = { status: 'Expired' }
  await linkEmployee(body, getLink(Document), { isUpdate: true })
  assert.deepEqual(body, { status: 'Expired' })
})

test('clearing the holder of an asset clears the copied name', async () => {
  const body = { employeeId: '', employeeName: 'Old Holder' }
  await linkEmployee(body, getLink(Asset))
  assert.deepEqual(body, { employeeId: '', employeeName: '' })
})
