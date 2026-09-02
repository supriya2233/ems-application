import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import {
  getPerformanceRecords,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from '../services/performanceService'

const initialForm = {
  reviewId: '',
  employeeId: '',
  employeeName: '',
  department: '',
  reviewPeriod: '',
  reviewDate: '',
  reviewer: '',
  rating: 3,
  status: 'Draft',
  strengths: '',
  improvements: '',
  goals: '',
  comments: '',
}

const statusOptions = [
  'Draft',
  'In Review',
  'Completed',
]

function Performance() {
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

      const data = await getPerformanceRecords()
      setRecords(data)
    } catch (err) {
      setError(
        err.message || 'Failed to load performance records',
      )
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
        record.reviewId?.toLowerCase().includes(query) ||
        record.employeeId?.toLowerCase().includes(query) ||
        record.employeeName?.toLowerCase().includes(query) ||
        record.department?.toLowerCase().includes(query) ||
        record.reviewer?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        record.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [records, search, statusFilter])

  const summary = useMemo(() => {
    const total = records.length

    const completed = records.filter(
      (record) => record.status === 'Completed',
    ).length

    const inReview = records.filter(
      (record) => record.status === 'In Review',
    ).length

    const averageRating =
      total === 0
        ? 0
        : (
            records.reduce(
              (sum, record) =>
                sum + Number(record.rating || 0),
              0,
            ) / total
          ).toFixed(1)

    return {
      total,
      completed,
      inReview,
      averageRating,
    }
  }, [records])

  const openAddModal = () => {
    setEditingRecord(null)

    setForm({
      ...initialForm,
      reviewId: `REV${String(records.length + 1).padStart(3, '0')}`,
      reviewDate: new Date().toISOString().split('T')[0],
    })

    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)

    setForm({
      reviewId: record.reviewId || '',
      employeeId: record.employeeId || '',
      employeeName: record.employeeName || '',
      department: record.department || '',
      reviewPeriod: record.reviewPeriod || '',
      reviewDate: record.reviewDate
        ? new Date(record.reviewDate)
            .toISOString()
            .split('T')[0]
        : '',
      reviewer: record.reviewer || '',
      rating: record.rating ?? 3,
      status: record.status || 'Draft',
      strengths: record.strengths || '',
      improvements: record.improvements || '',
      goals: record.goals || '',
      comments: record.comments || '',
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
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: name === 'rating' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (editingRecord) {
        const updated = await updatePerformance(
          editingRecord._id,
          form,
        )

        setRecords((current) =>
          current.map((record) =>
            record._id === updated._id
              ? updated
              : record,
          ),
        )
      } else {
        const created = await createPerformance(form)

        setRecords((current) => [created, ...current])
      }

      closeModal()
    } catch (err) {
      setError(
        err.message || 'Failed to save performance record',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete performance review for ${record.employeeName}?`,
    )

    if (!confirmed) return

    try {
      setError('')

      await deletePerformance(record._id)

      setRecords((current) =>
        current.filter(
          (item) => item._id !== record._id,
        ),
      )
    } catch (err) {
      setError(
        err.message || 'Failed to delete performance record',
      )
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Review':
        return 'info'
      default:
        return 'neutral'
    }
  }

  const renderRating = (rating) => {
    const value = Number(rating || 0)

    return (
      <div className="performance-rating">
        <span className="performance-rating-value">
          {value.toFixed(1)}
        </span>

        <span className="performance-rating-scale">
          / 5
        </span>
      </div>
    )
  }

  return (
    <div className="page-container performance-page">
      <PageHeader
        title="Performance"
        subtitle="Manage employee reviews, ratings, goals, and feedback."
        actions={
          <Button onClick={openAddModal}>
            + Add Review
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
            Total Reviews
          </div>

          <div className="stat-card-value">
            {summary.total}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            In Review
          </div>

          <div className="stat-card-value">
            {summary.inReview}
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

        <div className="stat-card">
          <div className="stat-card-label">
            Average Rating
          </div>

          <div className="stat-card-value">
            {summary.averageRating}
            <span className="stat-card-unit">/ 5</span>
          </div>
        </div>
      </div>

      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <h2>Performance Reviews</h2>

            <p>
              Review employee performance and track development
              goals.
            </p>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search employees or reviews..."
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
            Loading performance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="ui-empty-state">
            <div className="ui-empty-state-title">
              No performance reviews found
            </div>

            <div className="ui-empty-state-description">
              Add a performance review to start tracking employee
              development.
            </div>
          </div>
        ) : (
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Review Period</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Review Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div className="table-primary">
                        {record.employeeName}
                      </div>

                      <div className="table-secondary">
                        {record.employeeId} · {record.department}
                      </div>
                    </td>

                    <td>
                      {record.reviewPeriod || '—'}
                    </td>

                    <td>
                      {record.reviewer || '—'}
                    </td>

                    <td>
                      {renderRating(record.rating)}
                    </td>

                    <td>
                      {record.reviewDate
                        ? new Date(
                            record.reviewDate,
                          ).toLocaleDateString()
                        : '—'}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={
            editingRecord
              ? 'Edit Performance Review'
              : 'Add Performance Review'
          }
          onClose={closeModal}
        >
          <form
            className="ui-form"
            onSubmit={handleSubmit}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Review ID</label>

                <input
                  name="reviewId"
                  value={form.reviewId}
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
                  placeholder="EMP001"
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
                <label>Review Period</label>

                <input
                  name="reviewPeriod"
                  value={form.reviewPeriod}
                  onChange={handleChange}
                  required
                  placeholder="Q3 2026"
                />
              </div>

              <div className="form-group">
                <label>Review Date</label>

                <input
                  type="date"
                  name="reviewDate"
                  value={form.reviewDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reviewer</label>

                <input
                  name="reviewer"
                  value={form.reviewer}
                  onChange={handleChange}
                  required
                  placeholder="Manager name"
                />
              </div>

              <div className="form-group">
                <label>Rating</label>

                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  required
                >
                  <option value={1}>1 — Needs Improvement</option>
                  <option value={2}>2 — Below Expectations</option>
                  <option value={3}>3 — Meets Expectations</option>
                  <option value={4}>4 — Exceeds Expectations</option>
                  <option value={5}>5 — Outstanding</option>
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

            <div className="form-group">
              <label>Strengths</label>

              <textarea
                name="strengths"
                value={form.strengths}
                onChange={handleChange}
                rows="3"
                placeholder="Key strengths and achievements..."
              />
            </div>

            <div className="form-group">
              <label>Areas for Improvement</label>

              <textarea
                name="improvements"
                value={form.improvements}
                onChange={handleChange}
                rows="3"
                placeholder="Areas that could be improved..."
              />
            </div>

            <div className="form-group">
              <label>Goals</label>

              <textarea
                name="goals"
                value={form.goals}
                onChange={handleChange}
                rows="3"
                placeholder="Goals for the next review period..."
              />
            </div>

            <div className="form-group">
              <label>Comments</label>

              <textarea
                name="comments"
                value={form.comments}
                onChange={handleChange}
                rows="3"
                placeholder="Additional comments..."
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
                    ? 'Update Review'
                    : 'Add Review'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewRecord && (
        <Modal
          title="Performance Review Details"
          onClose={() => setViewRecord(null)}
        >
          <div className="detail-grid">
            <div>
              <span className="detail-label">
                Review ID
              </span>

              <strong>{viewRecord.reviewId}</strong>
            </div>

            <div>
              <span className="detail-label">
                Employee
              </span>

              <strong>
                {viewRecord.employeeName}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Employee ID
              </span>

              <strong>
                {viewRecord.employeeId}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Department
              </span>

              <strong>
                {viewRecord.department}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Review Period
              </span>

              <strong>
                {viewRecord.reviewPeriod}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Reviewer
              </span>

              <strong>
                {viewRecord.reviewer}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Rating
              </span>

              <strong>
                {Number(viewRecord.rating || 0).toFixed(1)} / 5
              </strong>
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

          <div className="detail-notes">
            <span className="detail-label">
              Strengths
            </span>

            <p>
              {viewRecord.strengths ||
                'No strengths recorded.'}
            </p>
          </div>

          <div className="detail-notes">
            <span className="detail-label">
              Areas for Improvement
            </span>

            <p>
              {viewRecord.improvements ||
                'No improvement areas recorded.'}
            </p>
          </div>

          <div className="detail-notes">
            <span className="detail-label">
              Goals
            </span>

            <p>
              {viewRecord.goals ||
                'No goals recorded.'}
            </p>
          </div>

          <div className="detail-notes">
            <span className="detail-label">
              Comments
            </span>

            <p>
              {viewRecord.comments ||
                'No comments available.'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Performance