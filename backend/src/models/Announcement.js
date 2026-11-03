import mongoose from 'mongoose'

export const ANNOUNCEMENT_CATEGORIES = ['General', 'Company', 'Policy', 'Event', 'Celebration', 'IT']

// "Everyone", or the name of one department.
export const EVERYONE = 'Everyone'

const announcementSchema = new mongoose.Schema(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Give the announcement a title'],
      trim: true,
      maxlength: [120, 'Keep the title under 120 characters'],
    },
    body: {
      type: String,
      required: [true, 'Write the announcement text'],
      trim: true,
      maxlength: [4000, 'Keep the announcement under 4,000 characters'],
    },
    category: {
      type: String,
      enum: ANNOUNCEMENT_CATEGORIES,
      default: 'General',
    },
    audience: {
      type: String,
      trim: true,
      default: EVERYONE,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    author: {
      type: String,
      trim: true,
      default: 'Administrator', // no login in this app
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

const Announcement = mongoose.model('Announcement', announcementSchema)

export default Announcement
