import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import { useToast } from '../components/common/feedbackContext'
import { getSettings, updateSettings } from '../services/settingsService'
import { LEAVE_TYPES, formatDay, toInputDate } from '../utils/leave'

// Displayed Monday-first; values are JavaScript weekdays (0 = Sunday).
const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const toForm = (settings) => ({
  leaveAllowances: Object.fromEntries(
    LEAVE_TYPES.map((type) => [type, settings.leaveAllowances?.[type] ?? '']),
  ),
  workingDays: settings.workingDays ?? [1, 2, 3, 4, 5],
  holidays: (settings.holidays ?? []).map((holiday) => ({
    date: toInputDate(holiday.date),
    name: holiday.name,
  })),
})

/*
 * Company settings used by leave:
 *  - yearly allowance per leave type (empty = no limit)
 *  - working days of the week
 *  - company holidays
 * Changing them re-counts future requests; saved leave keeps its days.
 */
function Settings() {
  const toast = useToast()

  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })

  useEffect(() => {
    getSettings()
      .then((data) => {
        setForm(toForm(data))
        setSaved(JSON.stringify(toForm(data)))
      })
      .catch((err) => setError(err.message || 'Failed to load settings'))
  }, [])

  const isDirty = form && JSON.stringify(form) !== saved

  const setAllowance = (type, value) =>
    setForm((current) => ({
      ...current,
      leaveAllowances: { ...current.leaveAllowances, [type]: value },
    }))

  const toggleDay = (day) =>
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((value) => value !== day)
        : [...current.workingDays, day].sort(),
    }))

  const addHoliday = (event) => {
    event.preventDefault()
    if (!newHoliday.date || !newHoliday.name.trim()) return

    if (form.holidays.some((holiday) => holiday.date === newHoliday.date)) {
      toast.error(`There is already a holiday on ${formatDay(newHoliday.date)}`)
      return
    }

    setForm((current) => ({
      ...current,
      holidays: [...current.holidays, { date: newHoliday.date, name: newHoliday.name.trim() }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
    setNewHoliday({ date: '', name: '' })
  }

  const removeHoliday = (date) =>
    setForm((current) => ({
      ...current,
      holidays: current.holidays.filter((holiday) => holiday.date !== date),
    }))

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      const data = await updateSettings({
        leaveAllowances: Object.fromEntries(
          Object.entries(form.leaveAllowances).map(([type, value]) => [type, value === '' ? null : Number(value)]),
        ),
        workingDays: form.workingDays,
        holidays: form.holidays,
      })

      setForm(toForm(data))
      setSaved(JSON.stringify(toForm(data)))
      toast.success('Settings saved')
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <div className="settings-page">
        <PageHeader title="Settings" description="Leave rules for the whole company." />
        {error ? <div className="ui-alert ui-alert-error" role="alert">{error}</div> : <p className="ui-loading">Loading settings…</p>}
      </div>
    )
  }

  const thisYear = new Date().getFullYear()
  const upcomingCount = form.holidays.filter((holiday) => holiday.date.startsWith(String(thisYear))).length

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        description="Leave rules for the whole company. New requests use these immediately."
        action={
          <Button onClick={handleSave} loading={saving} disabled={!isDirty || saving}>
            {isDirty ? 'Save changes' : 'Saved'}
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      {/* Leave allowances */}
      <section className="ui-card settings-section" aria-labelledby="settings-allowances">
        <header className="settings-section-header">
          <h2 id="settings-allowances">Leave allowance per year</h2>
          <p>Working days each employee can take per leave type. Leave the box empty for no limit.</p>
        </header>

        <div className="settings-allowances">
          {LEAVE_TYPES.map((type) => (
            <div className="form-group" key={type}>
              <label htmlFor={`allowance-${type}`}>{type}</label>
              <div className="settings-input-suffix">
                <input
                  id={`allowance-${type}`}
                  type="number"
                  min="0"
                  max="365"
                  step="1"
                  inputMode="numeric"
                  placeholder="No limit"
                  value={form.leaveAllowances[type]}
                  onChange={(event) => setAllowance(type, event.target.value)}
                />
                <span aria-hidden="true">days</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Working days */}
      <section className="ui-card settings-section" aria-labelledby="settings-week">
        <header className="settings-section-header">
          <h2 id="settings-week">Working week</h2>
          <p>Leave is only counted on these days. Other days show as days off in the calendar.</p>
        </header>

        <fieldset className="settings-weekdays">
          <legend className="visually-hidden">Working days</legend>
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="settings-day">
              <input
                type="checkbox"
                checked={form.workingDays.includes(day.value)}
                onChange={() => toggleDay(day.value)}
              />
              <span>{day.label}</span>
            </label>
          ))}
        </fieldset>
        {form.workingDays.length === 0 && (
          <p className="form-hint settings-error">Choose at least one working day.</p>
        )}
      </section>

      {/* Holidays */}
      <section className="ui-card settings-section" aria-labelledby="settings-holidays">
        <header className="settings-section-header">
          <h2 id="settings-holidays">Company holidays</h2>
          <p>
            Not counted as leave days. {upcomingCount > 0 && `${upcomingCount} in ${thisYear}.`}
          </p>
        </header>

        <form className="settings-holiday-form" onSubmit={addHoliday}>
          <div className="form-group">
            <label htmlFor="holiday-date">Date</label>
            <input
              id="holiday-date"
              type="date"
              value={newHoliday.date}
              onChange={(event) => setNewHoliday((current) => ({ ...current, date: event.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="holiday-name">Name</label>
            <input
              id="holiday-name"
              type="text"
              placeholder="e.g. Diwali"
              value={newHoliday.name}
              onChange={(event) => setNewHoliday((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>
          <Button type="submit" variant="secondary" icon={<Plus size={16} aria-hidden="true" />}>
            Add holiday
          </Button>
        </form>

        {form.holidays.length === 0 ? (
          <p className="leave-muted">No holidays added yet.</p>
        ) : (
          <ul className="settings-holidays">
            {form.holidays.map((holiday) => (
              <li key={holiday.date}>
                <time dateTime={holiday.date}>
                  {new Date(`${holiday.date}T00:00:00Z`).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
                <span>{holiday.name}</span>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => removeHoliday(holiday.date)}
                  aria-label={`Remove ${holiday.name}`}
                  icon={<Trash2 size={14} aria-hidden="true" />}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isDirty && (
        <div className="settings-savebar" role="status">
          <span>You have unsaved changes.</span>
          <Button onClick={handleSave} loading={saving} disabled={saving}>
            Save changes
          </Button>
        </div>
      )}
    </div>
  )
}

export default Settings
