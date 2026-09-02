import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import {
  getOnboardingRecords,
  createOnboarding,
  updateOnboarding,
  deleteOnboarding,
} from '../services/onboardingService'

const initialForm = {
  onboardingId: '',
  employeeId: '',
  employeeName: '',
  department: '',
  joiningDate: '',
  onboardingType: 'New Hire',
  status: 'Not Started',
  documents: false,
  orientation: false,
  equipment: false,
  systemAccess: false,
  notes: '',
}

const statusOptions = [
  'Not Started',
  'In Progress',
  'Completed',
]

const typeOptions = [
  'New Hire',
  'Internal Transfer',
  'Rehire',
]

function Onboarding() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getOnboardingRecords()
      setRecords(data)
    } catch (err) {
      setError(err.message || 'Failed to load onboarding records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.onboardingId?.toLowerCase().includes(query) ||
        record.employeeId?.toLowerCase().includes(query) ||
        record.employeeName?.toLowerCase().includes(query) ||
        record.department?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        record.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [records, search, statusFilter])

  const summary = useMemo(() => {
    return {
      total: records.length,
      notStarted: records.filter(
        (record) => record.status === 'Not Started',
      ).length,
      inProgress: records.filter(
        (record) => record.status === 'In Progress',
      ).length,
      completed: records.filter(
        (record) => record.status === 'Completed',
      ).length,
    }
  }, [records])

  const openAddModal = () => {
    setEditingRecord(null)

    setForm({
      ...initialForm,
      onboardingId: `ONB${String(records.length + 1).padStart(3, '0')}`,
    })

    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)

    setForm({
      onboardingId: record.onboardingId || '',
      employeeId: record.employeeId || '',
      employeeName: record.employeeName || '',
      department: record.department || '',
      joiningDate: record.joiningDate
        ? new Date(record.joiningDate)
            .toISOString()
            .split('T')[0]
        : '',
      onboardingType:
        record.onboardingType || 'New Hire',
      status: record.status || 'Not Started',
      documents: Boolean(record.documents),
      orientation: Boolean(record.orientation),
      equipment: Boolean(record.equipment),
      systemAccess: Boolean(record.systemAccess),
      notes: record.notes || '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingRecord(null)
    setForm(initialForm)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (editingRecord) {
        const updated = await updateOnboarding(
          editingRecord._id,
          form,
        )

        setRecords((current) =>
          current.map((record) =>
            record._id === updated._id ? updated : record,
          ),
        )
      } else {
        const created = await createOnboarding(form)

        setRecords((current) => [created, ...current])
      }

      closeModal()
    } catch (err) {
      setError(
        err.message || 'Failed to save onboarding record',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete onboarding record for ${record.employeeName}?`,
    )

    if (!confirmed) return

    try {
      setError('')

      await deleteOnboarding(record._id)

      setRecords((current) =>
        current.filter((item) => item._id !== record._id),
      )
    } catch (err) {
      setError(
        err.message || 'Failed to delete onboarding record',
      )
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'info'
      default:
        return 'neutral'
    }
  }

  const completedSteps = (record) =>
    [
      record.documents,
      record.orientation,
      record.equipment,
      record.systemAccess,
    ].filter(Boolean).length

  return (
    <div className="page-container onboarding-page">
      <PageHeader
        title="Onboarding"
        subtitle="Manage employee onboarding and track completion progress."
        actions={
          <Button onClick={openAddModal}>
            + Start Onboarding
          </Button>
        }
      />

      {error && (
        <div className="ui-alert ui-alert-error">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            Total Onboarding
          </div>
          <div className="stat-card-value">
            {summary.total}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            Not Started
          </div>
          <div className="stat-card-value">
            {summary.notStarted}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            In Progress
          </div>
          <div className="stat-card-value">
            {summary.inProgress}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            Completed
          </div>
          <div className="stat-card-value">
            {summary.completed}
          </div>
        </div>
      </div>

      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <h2>Onboarding Records</h2>
            <p>
              Track new hires and monitor their onboarding progress.
            </p>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
          />

          <select
            className="ui-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
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
            Loading onboarding records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="ui-empty-state">
            <div className="ui-empty-state-title">
              No onboarding records found
            </div>

            <div className="ui-empty-state-description">
              Start an onboarding record to begin tracking employee
              onboarding.
            </div>
          </div>
        ) : (
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Joining Date</th>
                  <th>Type</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => {
                  const steps = completedSteps(record)

                  return (
                    <tr key={record._id}>
                      <td>
                        <div className="table-primary">
                          {record.employeeName}
                        </div>

                        <div className="table-secondary">
                          {record.employeeId}
                        </div>
                      </td>

                      <td>{record.department}</td>

                      <td>
                        {record.joiningDate
                          ? new Date(
                              record.joiningDate,
                            ).toLocaleDateString()
                          : '—'}
                      </td>

                      <td>{record.onboardingType}</td>

                      <td>
                        <div>
                          <strong>{steps}/4</strong>
                          <div className="table-secondary">
                            steps completed
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge
                          variant={getStatusVariant(
                            record.status,
                          )}
                        >
                          {record.status}
                        </Badge>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="ui-button ui-button-secondary ui-button-small"
                            onClick={() =>
                              setViewRecord(record)
                            }
                          >
                            View
                          </button>

                          <button
                            className="ui-button ui-button-secondary ui-button-small"
                            onClick={() =>
                              openEditModal(record)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="ui-button ui-button-danger ui-button-small"
                            onClick={() =>
                              handleDelete(record)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={
            editingRecord
              ? 'Edit Onboarding'
              : 'Start Onboarding'
          }
          onClose={closeModal}
        >
          <form
            className="ui-form"
            onSubmit={handleSubmit}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Onboarding ID</label>

                <input
                  name="onboardingId"
                  value={form.onboardingId}
                  onChange={handleChange}
                  required
                  disabled={Boolean(editingRecord)}
                />
              </div>

              <div className="form-group">
                <label>Employee ID</label>

                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  placeholder="EMP002"
                />
              </div>

              <div className="form-group">
                <label>Employee Name</label>

                <input
                  name="employeeName"
                  value={form.employeeName}
                  onChange={handleChange}
                  required
                  placeholder="Employee name"
                />
              </div>

              <div className="form-group">
                <label>Department</label>

                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                  placeholder="Engineering"
                />
              </div>

              <div className="form-group">
                <label>Joining Date</label>

                <input
                  type="date"
                  name="joiningDate"
                  value={form.joiningDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Onboarding Type</label>

                <select
                  name="onboardingType"
                  value={form.onboardingType}
                  onChange={handleChange}
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
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
            </div>

            <div className="onboarding-checklist">
              <h3>Onboarding Checklist</h3>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="documents"
                  checked={form.documents}
                  onChange={handleChange}
                />
                <span>Documents completed</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="orientation"
                  checked={form.orientation}
                  onChange={handleChange}
                />
                <span>Orientation completed</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="equipment"
                  checked={form.equipment}
                  onChange={handleChange}
                />
                <span>Equipment assigned</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="systemAccess"
                  checked={form.systemAccess}
                  onChange={handleChange}
                />
                <span>System access provided</span>
              </label>
            </div>

            <div className="form-group">
              <label>Notes</label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Additional onboarding notes..."
              />
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingRecord
                    ? 'Update Onboarding'
                    : 'Start Onboarding'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewRecord && (
        <Modal
          title="Onboarding Details"
          onClose={() => setViewRecord(null)}
        >
          <div className="detail-grid">
            <div>
              <span className="detail-label">
                Onboarding ID
              </span>
              <strong>{viewRecord.onboardingId}</strong>
            </div>

            <div>
              <span className="detail-label">
                Employee ID
              </span>
              <strong>{viewRecord.employeeId}</strong>
            </div>

            <div>
              <span className="detail-label">
                Employee Name
              </span>
              <strong>{viewRecord.employeeName}</strong>
            </div>

            <div>
              <span className="detail-label">
                Department
              </span>
              <strong>{viewRecord.department}</strong>
            </div>

            <div>
              <span className="detail-label">
                Joining Date
              </span>
              <strong>
                {viewRecord.joiningDate
                  ? new Date(
                      viewRecord.joiningDate,
                    ).toLocaleDateString()
                  : '—'}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Onboarding Type
              </span>
              <strong>{viewRecord.onboardingType}</strong>
            </div>

            <div>
              <span className="detail-label">
                Status
              </span>

              <Badge
                variant={getStatusVariant(
                  viewRecord.status,
                )}
              >
                {viewRecord.status}
              </Badge>
            </div>
          </div>

          <div className="onboarding-detail-checklist">
            <h3>Checklist</h3>

            <div>
              {viewRecord.documents ? '✓' : '○'} Documents
            </div>

            <div>
              {viewRecord.orientation ? '✓' : '○'} Orientation
            </div>

            <div>
              {viewRecord.equipment ? '✓' : '○'} Equipment
            </div>

            <div>
              {viewRecord.systemAccess ? '✓' : '○'} System Access
            </div>
          </div>

          <div className="detail-notes">
            <span className="detail-label">Notes</span>
            <p>
              {viewRecord.notes || 'No notes available.'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Onboarding