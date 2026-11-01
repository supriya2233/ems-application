import mongoose from 'mongoose'

/*
 * Something a person should look at: a leave request waiting for
 * approval, a new hire, a completed task, ...
 */
const notificationSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    tone: { type: String, enum: ['info', 'success', 'warning'], default: 'info' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
)

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
