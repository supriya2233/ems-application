import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        'Present',
        'Late',
        'Absent',
        'WFH',
      ],
      required: true,
    },

    checkIn: {
      type: String,
      trim: true,
      default: '',
    },

    checkOut: {
      type: String,
      trim: true,
      default: '',
    },

    hours: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

attendanceSchema.index(
  {
    employeeId: 1,
    date: 1,
  },
  {
    unique: true,
  },
)

const Attendance =
  mongoose.model(
    'Attendance',
    attendanceSchema,
  )

export default Attendance