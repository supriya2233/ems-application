import mongoose from 'mongoose'

/*
 * One document per ID sequence, e.g. { _id: 'employees', seq: 12 }.
 * The server increments it atomically, so two people saving at the
 * same moment can never get the same ID.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
)

const Counter = mongoose.model('Counter', counterSchema)

export default Counter
