import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Laptop } from 'lucide-react'

import Button from '../common/Button'
import Modal from '../common/Modal'
import { getAssets } from '../../services/assetService'

/*
 * The "Equipment handed over" step: pick an available asset and
 * hand it over, or tick the step without one (e.g. they brought
 * their own laptop). onConfirm receives the asset's _id or null.
 */
function EquipmentStepModal({ record, onClose, onConfirm }) {
  const [assets, setAssets] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [assetId, setAssetId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let ignore = false
    getAssets()
      .then((data) => {
        if (ignore) return
        const available = data.filter((asset) => asset.status === 'Available' && !asset.employeeId)
        setAssets(available)
        setAssetId(available[0]?._id || '')
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message || 'Could not load assets')
      })
    return () => {
      ignore = true
    }
  }, [])

  const confirm = async (withAsset) => {
    setSaving(withAsset ? 'asset' : 'plain')
    const ok = await onConfirm(withAsset ? assetId : null)
    if (!ok) setSaving(false)
  }

  return (
    <Modal title={`Equipment for ${record.employeeName}`} onClose={() => !saving && onClose()} size="sm">
      <div className="equipment-step">
        <p className="hire-intro">
          <Laptop size={18} aria-hidden="true" />
          <span>Choose an available asset. It will be marked as assigned to {record.employeeName}, with the date in its history.</span>
        </p>

        {loadError && <div className="ui-alert ui-alert-error" role="alert">{loadError}</div>}

        {assets === null && !loadError ? (
          <p className="ui-loading">Loading available assets…</p>
        ) : assets?.length === 0 ? (
          <p className="leave-muted">
            No assets are available right now. <Link to="/assets">Add one on the Assets page</Link>, or tick the step without an asset.
          </p>
        ) : (
          assets && (
            <div className="form-group">
              <label htmlFor="equipment-asset">Asset</label>
              <select id="equipment-asset" value={assetId} onChange={(event) => setAssetId(event.target.value)}>
                {assets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.assetName} · {asset.category} · {asset.assetId}
                    {asset.condition ? ` (${asset.condition})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        <div className="modal-actions">
          <Button variant="ghost" onClick={() => confirm(false)} loading={saving === 'plain'} disabled={Boolean(saving)}>
            Tick without an asset
          </Button>
          <Button onClick={() => confirm(true)} loading={saving === 'asset'} disabled={!assetId || Boolean(saving)}>
            Hand over and tick
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EquipmentStepModal
