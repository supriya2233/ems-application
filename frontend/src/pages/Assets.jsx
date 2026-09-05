import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../services/assetService'

const initialForm = {
  assetId: '',
  assetName: '',
  category: 'Laptop',
  serialNumber: '',
  employeeId: '',
  employeeName: '',
  assignedDate: '',
  status: 'Available',
  condition: 'Good',
  value: '',
  notes: '',
}

const categoryOptions = [
  'Laptop',
  'Desktop',
  'Monitor',
  'Mobile',
  'Tablet',
  'Printer',
  'Furniture',
  'Other',
]

const statusOptions = [
  'Available',
  'Assigned',
  'Under Maintenance',
  'Retired',
]

const conditionOptions = [
  'New',
  'Good',
  'Fair',
  'Damaged',
]

const getStatusVariant = (status) => {
  switch (status) {
    case 'Available':
      return 'success'
    case 'Assigned':
      return 'info'
    case 'Under Maintenance':
      return 'warning'
    case 'Retired':
      return 'danger'
    default:
      return 'neutral'
  }
}

const getConditionVariant = (condition) => {
  switch (condition) {
    case 'New':
      return 'success'
    case 'Good':
      return 'info'
    case 'Fair':
      return 'warning'
    case 'Damaged':
      return 'danger'
    default:
      return 'neutral'
  }
}

const formatDate = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return `₹${Number(value).toLocaleString('en-IN')}`
}

function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [viewAsset, setViewAsset] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getAssets()
      setAssets(data)
    } catch (err) {
      setError(err.message || 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase()

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.assetId?.toLowerCase().includes(query) ||
        asset.assetName?.toLowerCase().includes(query) ||
        asset.serialNumber?.toLowerCase().includes(query) ||
        asset.employeeId?.toLowerCase().includes(query) ||
        asset.employeeName?.toLowerCase().includes(query)

      const matchesCategory =
        categoryFilter === 'All' || asset.category === categoryFilter

      const matchesStatus =
        statusFilter === 'All' || asset.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [assets, search, categoryFilter, statusFilter])

  const summary = useMemo(() => {
    return {
      total: assets.length,
      available: assets.filter((asset) => asset.status === 'Available').length,
      assigned: assets.filter((asset) => asset.status === 'Assigned').length,
      maintenance: assets.filter(
        (asset) => asset.status === 'Under Maintenance',
      ).length,
    }
  }, [assets])

  const openAddModal = () => {
    setEditingAsset(null)
    setForm(initialForm)
    setShowModal(true)
  }

  const openEditModal = (asset) => {
    setEditingAsset(asset)

    setForm({
      assetId: asset.assetId || '',
      assetName: asset.assetName || '',
      category: asset.category || 'Other',
      serialNumber: asset.serialNumber || '',
      employeeId: asset.employeeId || '',
      employeeName: asset.employeeName || '',
      assignedDate: asset.assignedDate
        ? new Date(asset.assignedDate).toISOString().split('T')[0]
        : '',
      status: asset.status || 'Available',
      condition: asset.condition || 'Good',
      value:
        asset.value !== undefined && asset.value !== null
          ? String(asset.value)
          : '',
      notes: asset.notes || '',
    })

    setShowModal(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      const payload = {
        ...form,
        value: form.value === '' ? undefined : Number(form.value),
      }

      if (editingAsset) {
        const updatedAsset = await updateAsset(editingAsset._id, payload)

        setAssets((current) =>
          current.map((asset) =>
            asset._id === updatedAsset._id ? updatedAsset : asset,
          ),
        )
      } else {
        const createdAsset = await createAsset(payload)

        setAssets((current) => [createdAsset, ...current])
      }

      setShowModal(false)
      setEditingAsset(null)
      setForm(initialForm)
    } catch (err) {
      setError(err.message || 'Failed to save asset')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (asset) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset.assetName}"?`,
    )

    if (!confirmed) return

    try {
      setError('')

      await deleteAsset(asset._id)

      setAssets((current) =>
        current.filter((item) => item._id !== asset._id),
      )
    } catch (err) {
      setError(err.message || 'Failed to delete asset')
    }
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Manage organizational assets and employee assignments."
        action={
          <Button onClick={openAddModal}>
            Add Asset
          </Button>
        }
      />

      {error && (
        <div className="ui-alert ui-alert-error">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="ui-card">
          <div className="ui-card-header">
            <span>Total Assets</span>
          </div>
          <div className="stat-card-value">{summary.total}</div>
        </div>

        <div className="ui-card">
          <div className="ui-card-header">
            <span>Available</span>
          </div>
          <div className="stat-card-value">{summary.available}</div>
        </div>

        <div className="ui-card">
          <div className="ui-card-header">
            <span>Assigned</span>
          </div>
          <div className="stat-card-value">{summary.assigned}</div>
        </div>

        <div className="ui-card">
          <div className="ui-card-header">
            <span>Under Maintenance</span>
          </div>
          <div className="stat-card-value">{summary.maintenance}</div>
        </div>
      </div>

      <div className="ui-card">
        <div className="assets-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search assets, employees, or serial numbers..."
          />

          <select
            className="form-control"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="All">All Categories</option>

            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>

            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="ui-loading">
            Loading assets...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="ui-empty-state">
            <h3>No assets found</h3>
            <p>
              {assets.length === 0
                ? 'Add your first asset to get started.'
                : 'Try changing your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Employee</th>
                  <th>Assigned Date</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <div className="table-primary">
                        {asset.assetName}
                      </div>
                      <div className="table-secondary">
                        {asset.assetId}
                      </div>
                    </td>

                    <td>{asset.category}</td>

                    <td>
                      {asset.employeeName ? (
                        <>
                          <div className="table-primary">
                            {asset.employeeName}
                          </div>
                          <div className="table-secondary">
                            {asset.employeeId || '-'}
                          </div>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td>{formatDate(asset.assignedDate)}</td>

                    <td>
                      <Badge variant={getStatusVariant(asset.status)}>
                        {asset.status}
                      </Badge>
                    </td>

                    <td>
                      <Badge
                        variant={getConditionVariant(asset.condition)}
                      >
                        {asset.condition}
                      </Badge>
                    </td>

                    <td>{formatValue(asset.value)}</td>

                    <td>
                      <div className="table-actions">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setViewAsset(asset)}
                        >
                          View
                        </Button>

                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => openEditModal(asset)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(asset)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
<Modal
  isOpen={showModal}
  onClose={() => {
    if (!saving) {
      setShowModal(false)
    }
  }}
  title={editingAsset ? 'Edit Asset' : 'Add Asset'}
>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="assetId">Asset ID</label>
              <input
                id="assetId"
                name="assetId"
                value={form.assetId}
                onChange={handleChange}
                placeholder="AST001"
                required
                disabled={Boolean(editingAsset)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="assetName">Asset Name</label>
              <input
                id="assetName"
                name="assetName"
                value={form.assetName}
                onChange={handleChange}
                placeholder="Dell Latitude 5440"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="serialNumber">Serial Number</label>
              <input
                id="serialNumber"
                name="serialNumber"
                value={form.serialNumber}
                onChange={handleChange}
                placeholder="Serial number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                id="employeeId"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="EMP001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="employeeName">Employee Name</label>
              <input
                id="employeeName"
                name="employeeName"
                value={form.employeeName}
                onChange={handleChange}
                placeholder="Arjun Kumar"
              />
            </div>

            <div className="form-group">
              <label htmlFor="assignedDate">Assigned Date</label>
              <input
                id="assignedDate"
                name="assignedDate"
                type="date"
                value={form.assignedDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="condition"
                value={form.condition}
                onChange={handleChange}
              >
                {conditionOptions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="value">Value</label>
              <input
                id="value"
                name="value"
                type="number"
                min="0"
                value={form.value}
                onChange={handleChange}
                placeholder="65000"
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional asset information..."
                rows="3"
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingAsset
                  ? 'Update Asset'
                  : 'Add Asset'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewAsset)}
        onClose={() => setViewAsset(null)}
        title="Asset Details"
      >
        {viewAsset && (
          <div>
            <div className="detail-grid">
              <div>
                <strong>Asset ID</strong>
                <span>{viewAsset.assetId}</span>
              </div>

              <div>
                <strong>Asset Name</strong>
                <span>{viewAsset.assetName}</span>
              </div>

              <div>
                <strong>Category</strong>
                <span>{viewAsset.category}</span>
              </div>

              <div>
                <strong>Serial Number</strong>
                <span>{viewAsset.serialNumber || '-'}</span>
              </div>

              <div>
                <strong>Employee ID</strong>
                <span>{viewAsset.employeeId || '-'}</span>
              </div>

              <div>
                <strong>Employee Name</strong>
                <span>{viewAsset.employeeName || '-'}</span>
              </div>

              <div>
                <strong>Assigned Date</strong>
                <span>{formatDate(viewAsset.assignedDate)}</span>
              </div>

              <div>
                <strong>Status</strong>
                <span>
                  <Badge variant={getStatusVariant(viewAsset.status)}>
                    {viewAsset.status}
                  </Badge>
                </span>
              </div>

              <div>
                <strong>Condition</strong>
                <span>
                  <Badge
                    variant={getConditionVariant(viewAsset.condition)}
                  >
                    {viewAsset.condition}
                  </Badge>
                </span>
              </div>

              <div>
                <strong>Value</strong>
                <span>{formatValue(viewAsset.value)}</span>
              </div>
            </div>

            {viewAsset.notes && (
              <div className="detail-notes">
                <strong>Notes</strong>
                <p>{viewAsset.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Assets