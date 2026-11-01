import Setting from '../models/Setting.js'
import { AppError } from '../middleware/errorHandler.js'
import { LEAVE_TYPES, dayKey, fromDayKey } from './leaveRules.js'

const SETTINGS_ID = 'company'

/* The settings document, created with defaults the first time. */
export async function getSettings() {
  const settings = await Setting.findOneAndUpdate(
    { _id: SETTINGS_ID },
    { $setOnInsert: { _id: SETTINGS_ID } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean()

  return {
    ...settings,
    holidays: [...settings.holidays].sort((a, b) => new Date(a.date) - new Date(b.date)),
  }
}

/*
 * Checks and cleans what the Settings page sends, then saves it.
 * Only known fields are accepted.
 */
export async function updateSettings(input = {}) {
  const update = {}

  if (input.leaveAllowances) {
    update.leaveAllowances = {}

    for (const type of LEAVE_TYPES) {
      const value = input.leaveAllowances[type]

      if (value === null || value === '' || value === undefined) {
        update.leaveAllowances[type] = null
      } else if (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 365) {
        update.leaveAllowances[type] = Number(value)
      } else {
        throw new AppError(400, `${type} allowance must be a whole number between 0 and 365`)
      }
    }
  }

  if (input.workingDays) {
    const days = [...new Set(input.workingDays.map(Number))].filter(
      (day) => Number.isInteger(day) && day >= 0 && day <= 6,
    )

    if (days.length === 0) {
      throw new AppError(400, 'Choose at least one working day')
    }

    update.workingDays = days.sort()
  }

  if (input.holidays) {
    const seen = new Set()

    update.holidays = input.holidays.map((holiday) => {
      const key = dayKey(holiday.date)
      const name = String(holiday.name || '').trim()

      if (!key) throw new AppError(400, 'Every holiday needs a valid date')
      if (!name) throw new AppError(400, `Give the holiday on ${key} a name`)
      if (seen.has(key)) throw new AppError(400, `There are two holidays on ${key}`)
      seen.add(key)

      return { date: fromDayKey(key), name }
    })
  }

  await Setting.updateOne({ _id: SETTINGS_ID }, { $set: update }, { upsert: true, runValidators: true })

  return getSettings()
}
