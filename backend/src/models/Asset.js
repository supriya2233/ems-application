import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    assetName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        'Laptop',
        'Desktop',
        'Monitor',
        'Mobile',
        'Tablet',
        'Printer',
        'Keyboard',
        'Mouse',
        'Headset',
        'Furniture',
        'Other',
      ],
      default: 'Other',
    },

    employeeId: {
      type: String,
      trim: true,
    },

    employeeName: {
      type: String,
      trim: true,
    },

    assignedDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['Available', 'Assigned', 'Under Maintenance', 'Retired'],
      default: 'Available',
    },

    condition: {
      type: String,
      // 'Damaged' is what the Assets page offers; 'Poor' kept for old records
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
      default: 'Good',
    },

    serialNumber: {
      type: String,
      trim: true,
    },

    purchaseDate: {
      type: Date,
    },

    value: {
      type: Number,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Who had this asset, from when to when (services/assetService.js)
    history: {
      type: [
        {
          _id: false,
          employeeId: String,
          employeeName: String,
          assignedAt: Date,
          returnedAt: Date,
          conditionOut: String,
          conditionIn: String,
          note: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

const Asset = mongoose.model('Asset', assetSchema)

export default Asset