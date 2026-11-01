import Counter from '../models/Counter.js'

/*
 * Server-side ID generation (EMP004, TASK012, ...).
 *
 * Before: the browser used "number of records + 1". After a
 * delete that number is already taken, so saving failed with a
 * duplicate-key error. Now a counter in the database hands out
 * the next number and only ever goes up.
 */

export const ID_FORMATS = {
  employees: { prefix: 'EMP', field: 'employeeId', model: 'Employee' },
  departments: { prefix: 'DEP', field: 'departmentId', model: 'Department' },
  tasks: { prefix: 'TASK', field: 'taskId', model: 'Task' },
  assets: { prefix: 'AST', field: 'assetId', model: 'Asset' },
  documents: { prefix: 'DOC', field: 'documentId', model: 'Document' },
  onboarding: { prefix: 'ONB', field: 'onboardingId', model: 'Onboarding' },
  performance: { prefix: 'REV', field: 'reviewId', model: 'Performance' },
  recruitment: { prefix: 'CAN', field: 'candidateId', model: 'Recruitment' },
}

/* formatId('EMP', 7) → "EMP007" (at least 3 digits) */
export function formatId(prefix, number) {
  return `${prefix}${String(number).padStart(3, '0')}`
}

/* highestNumber(['EMP001', 'EMP010', 'MKG001'], 'EMP') → 10 */
export function highestNumber(ids, prefix) {
  const pattern = new RegExp(`^${prefix}(\\d+)$`)

  return ids.reduce((max, id) => {
    const match = pattern.exec(String(id ?? ''))
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
}

/*
 * nextId('employees') → "EMP004"
 *
 * The first time a sequence is used, it starts after the highest
 * ID already in the collection, so existing records are respected.
 */
export async function nextId(key, Model) {
  const { prefix, field } = ID_FORMATS[key]

  let counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' },
  )

  if (!counter) {
    const existing = await Model.find({}, { [field]: 1 }).lean()
    const start = highestNumber(existing.map((item) => item[field]), prefix)

    // $max never lowers the value, so two first-time saves at once
    // still end up with different numbers after the $inc below.
    await Counter.updateOne(
      { _id: key },
      { $max: { seq: start } },
      { upsert: true },
    )

    counter = await Counter.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { returnDocument: 'after' },
    )
  }

  return formatId(prefix, counter.seq)
}

/*
 * Fill in the ID on create when the browser didn't send one.
 * On a conflict (someone typed an ID that exists) the database's
 * unique index still rejects it with a clear message.
 */
export async function assignId(key, Model, body) {
  const { field } = ID_FORMATS[key]

  if (!String(body[field] ?? '').trim()) {
    body[field] = await nextId(key, Model)
  }

  return body
}
