import { useState } from 'react'
import { LogOut } from 'lucide-react'

import Button from '../common/Button'
import EmployeePicker from '../common/EmployeePicker'
import Modal from '../common/Modal'
import { useToast } from '../common/feedbackContext'
import { startOffboarding } from '../../services/offboardingService'
import { todayKey } from '../../utils/leave'
import { OFFBOARDING_REASONS } from '../../utils/offboarding'

/*
 * Start offboarding someone. Pass `employee` to fix the person
 * (from their profile); otherwise an employee picker is shown.
 * onStarted receives the new record (with its checklist).
 */
function StartOffboardingModal({ employee = null, onClose, onStarted }) {
  const toast = useToast()

  const [employeeId, setEmployeeId] = useState(employee?.employeeId || '')
  const [lastWorkingDay, setLastWorkingDay] = useState(todayKey())
  const [reason, setReason] = useState('Resignation')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const record = await startOffboarding({ employeeId, lastWorkingDay, reason, notes })
      const assets = record.items.filter((item) => item.kind === 'asset').length
      toast.success(
        `Offboarding started for ${record.employeeName}${assets ? ` (${assets} asset${assets === 1 ? '' : 's'} to collect)` : ''}`,
      )
      onStarted(record)
    } catch (err) {
      setError(err.message || 'Could not start offboarding')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={employee ? `Offboard ${employee.name}` : 'Start offboarding'}
      onClose={() => !saving && onClose()}
    >
      <form onSubmit={handleSubmit}>
        <p className="hire-intro">
          <LogOut size={18} aria-hidden="true" />
          <span>
            The checklist is built for you: one item for each asset they hold, then exit interview,
            handover, archiving documents and the final settlement. Finishing it makes the employee
            <strong> Inactive</strong>.
          </span>
        </p>

        {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

        <div className="form-grid">
          {!employee && (
            <div className="form-group form-group-full">
              <label htmlFor="offboard-employee">Employee</label>
              <EmployeePicker
                id="offboard-employee"
                value={employeeId}
                onChange={(picked) => setEmployeeId(picked?.employeeId || '')}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="offboard-last-day">Last working day</label>
            <input
              id="offboard-last-day"
              type="date"
              value={lastWorkingDay}
              onChange={(event) => setLastWorkingDay(event.target.value)}
              required
              aria-describedby="offboard-last-day-help"
            />
            <small id="offboard-last-day-help" className="hire-help">
              The final settlement pays working days up to this date.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="offboard-reason">Reason</label>
            <select id="offboard-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
              {OFFBOARDING_REASONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="offboard-notes">Notes</label>
            <textarea
              id="offboard-notes"
              rows="3"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. serving 30 days notice"
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={!employeeId}>Start offboarding</Button>
        </div>
      </form>
    </Modal>
  )
}

export default StartOffboardingModal
