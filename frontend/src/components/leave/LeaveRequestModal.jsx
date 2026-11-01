import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'

import Button from '../common/Button'
import EmployeePicker from '../common/EmployeePicker'
import Modal from '../common/Modal'
import LeaveBalances from './LeaveBalances'
import { useToast } from '../common/feedbackContext'
import { createLeave, getLeaveBalances, previewLeave } from '../../services/leaveService'
import { LEAVE_TYPES, plural } from '../../utils/leave'

const emptyForm = {
  employeeId: '',
  type: 'Annual',
  from: '',
  to: '',
  reason: '',
}

/*
 * "Request leave" dialog.
 *
 * While the form is filled in, the server previews the request:
 * working days (weekends and holidays skipped), the balance, and
 * warnings (over balance, teammates already off). Problems that
 * would block saving, like overlapping leave, disable Submit.
 */
function LeaveRequestModal({ isOpen, onClose, onCreated }) {
  const toast = useToast()

  const [form, setForm] = useState(emptyForm)
  const [balances, setBalances] = useState([])
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm)
      setBalances([])
      setPreview(null)
      setError('')
    }
  }, [isOpen])

  // Balances for the chosen employee
  useEffect(() => {
    if (!form.employeeId) return undefined
    let ignore = false

    getLeaveBalances(form.employeeId)
      .then((data) => {
        if (!ignore) setBalances(data)
      })
      .catch(() => {
        if (!ignore) setBalances([])
      })

    return () => {
      ignore = true
    }
  }, [form.employeeId])

  // Preview, 300 ms after the last change
  const ready = Boolean(form.employeeId && form.type && form.from && form.to)

  useEffect(() => {
    if (!ready) return undefined
    let ignore = false

    const timer = setTimeout(() => {
      previewLeave({ employeeId: form.employeeId, type: form.type, from: form.from, to: form.to })
        .then((data) => {
          if (!ignore) setPreview(data)
        })
        .catch((err) => {
          if (!ignore) setPreview({ days: 0, warnings: [], error: err.message })
        })
    }, 300)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [ready, form.employeeId, form.type, form.from, form.to])

  const shownPreview = ready ? preview : null

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => {
      const next = { ...current, [field]: value }
      // Picking a start date after the end date moves the end along.
      if (field === 'from' && (!current.to || current.to < value)) next.to = value
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.employeeId) {
      setError('Choose the employee who is taking leave.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const created = await createLeave({ ...form, status: 'Pending' })
      toast.success(`Leave request sent for ${created.employee} (${plural(created.days, 'working day')})`)
      onCreated?.(created)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit the leave request')
    } finally {
      setSaving(false)
    }
  }

  const blocked = Boolean(shownPreview?.error)

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title="Request leave"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

        <div className="form-grid">
          <div className="form-group form-group-full">
            <label htmlFor="leave-employee">Employee</label>
            <EmployeePicker
              id="leave-employee"
              value={form.employeeId}
              onChange={(employee) => {
                setForm((current) => ({ ...current, employeeId: employee?.employeeId || '' }))
                if (!employee) setBalances([])
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="leave-type">Leave type</label>
            <select id="leave-type" name="type" value={form.type} onChange={update('type')}>
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="leave-days">Working days</label>
            <output id="leave-days" className="form-static" aria-live="polite">
              {!ready
                ? 'Choose the dates'
                : !shownPreview
                  ? 'Counting…'
                  : shownPreview.error
                    ? '—'
                    : `${plural(shownPreview.days, 'day')} (weekends and holidays skipped)`}
            </output>
          </div>

          <div className="form-group">
            <label htmlFor="leave-from">From</label>
            <input id="leave-from" type="date" name="from" value={form.from} onChange={update('from')} required />
          </div>

          <div className="form-group">
            <label htmlFor="leave-to">To</label>
            <input id="leave-to" type="date" name="to" value={form.to} min={form.from || undefined} onChange={update('to')} required />
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="leave-reason">Reason</label>
            <textarea
              id="leave-reason"
              name="reason"
              rows="3"
              value={form.reason}
              onChange={update('reason')}
              placeholder="e.g. Family function"
              required
            />
          </div>
        </div>

        {/* Live checks */}
        {shownPreview?.error && (
          <div className="ui-alert ui-alert-error" role="alert">{shownPreview.error}</div>
        )}

        {shownPreview?.warnings?.map((warning) => (
          <div key={warning} className="ui-alert ui-alert-warning leave-warning">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{warning}</span>
          </div>
        ))}

        {balances.length > 0 && (
          <section className="leave-form-balances" aria-label={`Leave balance for ${new Date().getFullYear()}`}>
            <h3>Balance this year</h3>
            <LeaveBalances balances={balances} compact highlight={form.type} />
          </section>
        )}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={blocked || saving}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default LeaveRequestModal
