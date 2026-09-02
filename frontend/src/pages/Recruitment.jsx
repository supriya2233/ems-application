import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import {
  getRecruitments,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
} from '../services/recruitmentService'

const initialForm = {
  candidateId: '',
  candidateName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  experience: '',
  source: '',
  appliedDate: '',
  status: 'Applied',
  notes: '',
}

const statusOptions = [
  'Applied',
  'Screening',
  'Interview',
  'Selected',
  'Rejected',
]

function Recruitment() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [viewCandidate, setViewCandidate] = useState(null)

  const loadRecruitment = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getRecruitments()
      setCandidates(data)
    } catch (err) {
      setError(err.message || 'Failed to load recruitment records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecruitment()
  }, [])

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return candidates.filter((candidate) => {
      const matchesSearch =
        !query ||
        candidate.candidateId?.toLowerCase().includes(query) ||
        candidate.candidateName?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.position?.toLowerCase().includes(query) ||
        candidate.department?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' || candidate.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [candidates, search, statusFilter])

  const summary = useMemo(() => {
    return {
      total: candidates.length,
      applied: candidates.filter((item) => item.status === 'Applied').length,
      interview: candidates.filter((item) => item.status === 'Interview').length,
      selected: candidates.filter((item) => item.status === 'Selected').length,
    }
  }, [candidates])

  const openAddModal = () => {
    setEditingCandidate(null)
    setForm({
      ...initialForm,
      appliedDate: new Date().toISOString().split('T')[0],
    })
    setShowModal(true)
  }

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate)

    setForm({
      candidateId: candidate.candidateId || '',
      candidateName: candidate.candidateName || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      position: candidate.position || '',
      department: candidate.department || '',
      experience: candidate.experience ?? '',
      source: candidate.source || '',
      appliedDate: candidate.appliedDate
        ? new Date(candidate.appliedDate).toISOString().split('T')[0]
        : '',
      status: candidate.status || 'Applied',
      notes: candidate.notes || '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingCandidate(null)
    setForm(initialForm)
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
        experience:
          form.experience === '' ? 0 : Number(form.experience),
      }

      if (editingCandidate) {
        const updated = await updateRecruitment(
          editingCandidate._id,
          payload,
        )

        setCandidates((current) =>
          current.map((candidate) =>
            candidate._id === updated._id ? updated : candidate,
          ),
        )
      } else {
        const created = await createRecruitment(payload)
        setCandidates((current) => [created, ...current])
      }

      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save recruitment record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (candidate) => {
    const confirmed = window.confirm(
      `Delete recruitment record for ${candidate.candidateName}?`,
    )

    if (!confirmed) return

    try {
      setError('')

      await deleteRecruitment(candidate._id)

      setCandidates((current) =>
        current.filter((item) => item._id !== candidate._id),
      )
    } catch (err) {
      setError(err.message || 'Failed to delete recruitment record')
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Selected':
        return 'success'
      case 'Rejected':
        return 'danger'
      case 'Interview':
        return 'info'
      case 'Screening':
        return 'warning'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="page-container recruitment-page">
      <PageHeader
        title="Recruitment"
        subtitle="Manage candidates and track the hiring pipeline."
        actions={
          <Button onClick={openAddModal}>
            + Add Candidate
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
          <div className="stat-card-label">Total Candidates</div>
          <div className="stat-card-value">{summary.total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Applied</div>
          <div className="stat-card-value">{summary.applied}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Interviews</div>
          <div className="stat-card-value">{summary.interview}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Selected</div>
          <div className="stat-card-value">{summary.selected}</div>
        </div>
      </div>

      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <h2>Candidate Pipeline</h2>
            <p>Review and manage current recruitment applications.</p>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search candidates..."
          />

          <select
            className="ui-select"
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
            Loading recruitment records...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="ui-empty-state">
            <div className="ui-empty-state-title">
              No candidates found
            </div>
            <div className="ui-empty-state-description">
              Add a candidate to start building your recruitment pipeline.
            </div>
          </div>
        ) : (
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Experience</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate._id}>
                    <td>
                      <div className="table-primary">
                        {candidate.candidateName}
                      </div>
                      <div className="table-secondary">
                        {candidate.email}
                      </div>
                    </td>

                    <td>{candidate.position || '—'}</td>

                    <td>{candidate.department || '—'}</td>

                    <td>
                      {candidate.experience ?? 0} years
                    </td>

                    <td>
                      {candidate.appliedDate
                        ? new Date(
                            candidate.appliedDate,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <Badge
                        variant={getStatusClass(candidate.status)}
                      >
                        {candidate.status}
                      </Badge>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="ui-button ui-button-secondary ui-button-small"
                          onClick={() =>
                            setViewCandidate(candidate)
                          }
                        >
                          View
                        </button>

                        <button
                          className="ui-button ui-button-secondary ui-button-small"
                          onClick={() =>
                            openEditModal(candidate)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="ui-button ui-button-danger ui-button-small"
                          onClick={() =>
                            handleDelete(candidate)
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
            editingCandidate
              ? 'Edit Candidate'
              : 'Add Candidate'
          }
          onClose={closeModal}
        >
          <form
            className="ui-form"
            onSubmit={handleSubmit}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Candidate ID</label>
                <input
                  name="candidateId"
                  value={form.candidateId}
                  onChange={handleChange}
                  required
                  placeholder="CAN001"
                />
              </div>

              <div className="form-group">
                <label>Candidate Name</label>
                <input
                  name="candidateName"
                  value={form.candidateName}
                  onChange={handleChange}
                  required
                  placeholder="Candidate name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="candidate@example.com"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>

              <div className="form-group">
                <label>Position</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  required
                  placeholder="Software Engineer"
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
                <label>Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="2"
                />
              </div>

              <div className="form-group">
                <label>Source</label>
                <input
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="LinkedIn"
                />
              </div>

              <div className="form-group">
                <label>Applied Date</label>
                <input
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  onChange={handleChange}
                />
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
              <label>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Additional candidate notes..."
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

              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingCandidate
                    ? 'Update Candidate'
                    : 'Add Candidate'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewCandidate && (
        <Modal
          title="Candidate Details"
          onClose={() => setViewCandidate(null)}
        >
          <div className="detail-grid">
            <div>
              <span className="detail-label">Candidate ID</span>
              <strong>{viewCandidate.candidateId}</strong>
            </div>

            <div>
              <span className="detail-label">Name</span>
              <strong>{viewCandidate.candidateName}</strong>
            </div>

            <div>
              <span className="detail-label">Email</span>
              <strong>{viewCandidate.email}</strong>
            </div>

            <div>
              <span className="detail-label">Phone</span>
              <strong>{viewCandidate.phone || '—'}</strong>
            </div>

            <div>
              <span className="detail-label">Position</span>
              <strong>{viewCandidate.position}</strong>
            </div>

            <div>
              <span className="detail-label">Department</span>
              <strong>{viewCandidate.department}</strong>
            </div>

            <div>
              <span className="detail-label">Experience</span>
              <strong>
                {viewCandidate.experience ?? 0} years
              </strong>
            </div>

            <div>
              <span className="detail-label">Source</span>
              <strong>{viewCandidate.source || '—'}</strong>
            </div>

            <div>
              <span className="detail-label">Status</span>
              <Badge
                variant={getStatusClass(viewCandidate.status)}
              >
                {viewCandidate.status}
              </Badge>
            </div>

            <div>
              <span className="detail-label">Applied Date</span>
              <strong>
                {viewCandidate.appliedDate
                  ? new Date(
                      viewCandidate.appliedDate,
                    ).toLocaleDateString()
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="detail-notes">
            <span className="detail-label">Notes</span>
            <p>{viewCandidate.notes || 'No notes available.'}</p>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Recruitment