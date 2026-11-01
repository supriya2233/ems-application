import mongoose from 'mongoose'

/*
 * One line of history: who did what, to which record, when.
 * Written automatically from domain events (services/listeners.js).
 */
const activityLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true }, // e.g. "leave.approved"
    module: { type: String, required: true, index: true },
    action: { type: String, required: true },
    summary: { type: String, required: true },
    actor: { type: String, default: 'Administrator' },
    employeeId: { type: String, default: '', index: true },
    entityId: { type: String, default: '' },
    link: { type: String, default: '' },
    at: { type: Date, required: true, index: true },
  },
  { versionKey: false },
)

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
