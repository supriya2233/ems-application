import { useState } from 'react'

import Button from '../common/Button'
import EmployeePicker from '../common/EmployeePicker'
import Modal from '../common/Modal'
import { useToast } from '../common/feedbackContext'
import { assignAsset, returnAsset } from '../../services/assetService'
import { todayKey } from '../../utils/leave'

const CONDITIONS = ['New', 'Good', 'Fair', 'Damaged']

/*
 * Assign an available asset to someone, or take it back.
 *   mode "assign": who, date, condition when handed over
 *   mode "return": date, condition when returned, note
 * A Damaged return sends the asset to Under Maintenance.
 * Both are written to the asset's history by the server.
 */
function AssetHandoverModal({ asset, mode, onClose, onSaved }) {
  const toast = useToast()
  const assigning = mode === 'assign'

  const [employee, setEmployee] = useState(null)
  const [date, setDate] = useState(todayKey())
  const [condition, setCondition] = useState(
    CONDITIONS.includes(asset.condition) ? asset.condition : 'Good',
  )
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const updated = assigning
        ? await assignAsset(asset._id, { employeeId: employee?.employeeId, date, condition, note })
        : await returnAsset(asset._id, { date, condition, note })

      toast.success(
        assigning
          ? `${asset.assetName} assigned to ${updated.employeeName}`
          : updated.status === 'Under Maintenance'
            ? `${asset.assetName} returned and sent for maintenance`
            : `${asset.assetName} returned and available again`,
      )
      onSaved(updated)
    } catch (err) {
      setError(err.message || 'Could not save')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={assigning ? `Assign ${asset.assetName}` : `Return ${asset.assetName}`}
      onClose={() => !saving && onClose()}
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        {!assigning && (
          <p className="hire-intro">
            <span>
              Currently with <strong>{asset.employeeName || asset.employeeId}</strong>.
            </span>
          </p>
        )}

        {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

        <div className="form-grid">
          {assigning && (
            <div className="form-group form-group-full">
              <label htmlFor="handover-employee">Assign to</label>
              <EmployeePicker id="handover-employee" value={employee?.employeeId || ''} onChange={setEmployee} required />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="handover-date">{assigning ? 'Handed over on' : 'Returned on'}</label>
            <input
              id="handover-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="handover-condition">Condition</label>
            <select
              id="handover-condition"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              aria-describedby={!assigning ? 'handover-condition-help' : undefined}
            >
              {CONDITIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            {!assigning && (
              <small id="handover-condition-help" className="hire-help">
                Damaged items go to Under Maintenance.
              </small>
            )}
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="handover-note">Note</label>
            <input
              id="handover-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={assigning ? 'e.g. with charger and bag' : 'e.g. screen scratched'}
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={assigning && !employee}>
            {assigning ? 'Assign' : 'Mark as returned'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AssetHandoverModal
