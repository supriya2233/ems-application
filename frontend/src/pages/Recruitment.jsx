import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Columns3, List, Plus, UserCheck, UserPlus, Users, MessagesSquare } from 'lucide-react'

import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import DataTable from '../components/common/DataTable'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'
import HireModal from '../components/recruitment/HireModal'
import PipelineBoard from '../components/recruitment/PipelineBoard'
import { MOVABLE_STAGES, PIPELINE_STAGES } from '../utils/recruitment'
import {
  getRecruitments,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
} from '../services/recruitmentService'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { formatDay, todayKey } from '../utils/leave'

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

// The page remembers Board or Table between visits.
const VIEW_KEY = 'ems.recruitment.view'

function Recruitment() {
  const confirm = useConfirm()
  const toast = useToast()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'board')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [viewCandidate, setViewCandidate] = useState(null)
  const [hiring, setHiring] = useState(null)

  // Another tab moving or hiring a candidate updates this page.
  const refreshKey = useLiveRefresh(['recruitment'])

  useEffect(() => {
    let ignore = false

    getRecruitments()
      .then((data) => {
        if (!ignore) {
          setCandidates(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load recruitment records')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const changeView = (next) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  const replace = (updated) =>
    setCandidates((current) => current.map((item) => (item._id === updated._id ? updated : item)))

  /* ---------------- Filters & summary ---------------- */

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return candidates.filter((candidate) => {
      const matchesSearch =
        !query ||
        [candidate.candidateId, candidate.candidateName, candidate.email, candidate.position, candidate.department]
          .some((field) => String(field || '').toLowerCase().includes(query))

      // The board already groups by stage, so the status filter is for the table.
      const matchesStatus = view === 'board' || statusFilter === 'All' || candidate.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [candidates, search, statusFilter, view])

  const summary = useMemo(() => {
    const count = (status) => candidates.filter((item) => item.status === status).length
    const inProcess = candidates.filter((item) => ['Applied', 'Screening', 'Interview'].includes(item.status)).length

    return {
      total: candidates.length,
      inProcess,
      interview: count('Interview'),
      selected: count('Selected'),
      hired: count('Hired'),
    }
  }, [candidates])

  /* ---------------- Moving & hiring ---------------- */

  const moveCandidate = async (candidate, stage) => {
    if (candidate.status === stage) return

    // Show the move straight away; put it back if the save fails.
    replace({ ...candidate, status: stage })

    try {
      const updated = await updateRecruitment(candidate._id, { status: stage })
      replace(updated)
      toast.success(`${candidate.candidateName} moved to ${stage}`)
    } catch (err) {
      replace(candidate)
      toast.error(err.message || 'Could not move the candidate')
    }
  }

  const handleHired = ({ candidate }) => {
    replace(candidate)
    setHiring(null)
  }

  /* ---------------- Add / edit / delete ---------------- */

  const openAddModal = () => {
    setEditingCandidate(null)
    setForm({
      ...initialForm,
      appliedDate: todayKey(),
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
        experience: form.experience === '' ? 0 : Number(form.experience),
      }

      if (editingCandidate) {
        const updated = await updateRecruitment(editingCandidate._id, payload)
        replace(updated)
        toast.success('Candidate updated')
      } else {
        const created = await createRecruitment(payload)
        setCandidates((current) => [created, ...current])
        toast.success('Candidate added')
      }

      setSaving(false)
      setShowModal(false)
      setEditingCandidate(null)
      setForm(initialForm)
    } catch (err) {
      setError(err.message || 'Failed to save recruitment record')
      setSaving(false)
    }
  }

  const handleDelete = async (candidate) => {
    const confirmed = await confirm({
      title: 'Delete candidate?',
      message:
        candidate.status === 'Hired'
          ? `The recruitment record for ${candidate.candidateName} will be removed. Their employee record (${candidate.employeeId}) stays.`
          : `The record for ${candidate.candidateName} will be permanently removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      setError('')
      await deleteRecruitment(candidate._id)
      setCandidates((current) => current.filter((item) => item._id !== candidate._id))
      toast.success('Candidate deleted')
    } catch (err) {
      setError(err.message || 'Failed to delete recruitment record')
    }
  }

  /* ---------------- Table ---------------- */

  const columns = [
    {
      key: 'candidate',
      label: 'Candidate',
      render: (candidate) => (
        <>
          <div className="table-primary">{candidate.candidateName}</div>
          <div className="table-secondary">{candidate.email}</div>
        </>
      ),
    },
    { key: 'position', label: 'Position', render: (candidate) => candidate.position || '—' },
    { key: 'department', label: 'Department', render: (candidate) => candidate.department || '—' },
    { key: 'experience', label: 'Experience', render: (candidate) => `${candidate.experience ?? 0} years` },
    { key: 'applied', label: 'Applied', render: (candidate) => formatDay(candidate.appliedDate) },
    {
      key: 'status',
      label: 'Status',
      render: (candidate) =>
        candidate.status === 'Hired' && candidate.employeeId ? (
          <Link to={`/employees/${candidate.employeeId}`} className="recruitment-hired-link">
            <Badge>Hired</Badge>
            <span>{candidate.employeeId}</span>
          </Link>
        ) : (
          <Badge>{candidate.status}</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (candidate) => (
        <div className="table-actions">
          {candidate.status === 'Selected' && (
            <Button size="small" onClick={() => setHiring(candidate)}>
              Hire
            </Button>
          )}
          <Button size="small" variant="secondary" onClick={() => setViewCandidate(candidate)}>
            View
          </Button>
          <Button size="small" variant="secondary" onClick={() => openEditModal(candidate)}>
            Edit
          </Button>
          <Button
            size="small"
            variant="ghost"
            aria-label={`Delete ${candidate.candidateName}`}
            onClick={() => handleDelete(candidate)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  // A hired candidate keeps "Hired" (it can't be chosen by hand).
  const formStatusOptions =
    editingCandidate?.status === 'Hired' ? ['Hired'] : MOVABLE_STAGES

  const isFiltered = search || (view === 'table' && statusFilter !== 'All')

  return (
    <div className="recruitment-page">
      <PageHeader
        title="Recruitment"
        description="Move candidates through the pipeline and hire them straight into onboarding."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={openAddModal}>
            Add candidate
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Recruitment at a glance">
        <StatCard
          title="Candidates"
          value={summary.total}
          icon={<Users size={16} aria-hidden="true" />}
          description={`${summary.inProcess} still in process`}
        />
        <StatCard
          title="Interviewing"
          value={summary.interview}
          icon={<MessagesSquare size={16} aria-hidden="true" />}
          description="at the interview stage"
        />
        <StatCard
          title="Ready to hire"
          value={summary.selected}
          icon={<UserCheck size={16} aria-hidden="true" />}
          warning={summary.selected > 0}
          description={summary.selected > 0 ? 'selected, waiting for Hire' : 'nobody selected yet'}
        />
        <StatCard
          title="Hired"
          value={summary.hired}
          icon={<UserPlus size={16} aria-hidden="true" />}
          description={<Link to="/onboarding">See onboarding</Link>}
        />
      </section>

      <section className="ui-card recruitment-panel" aria-labelledby="recruitment-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="recruitment-title">Candidate pipeline</h2>
            <p>
              {view === 'board'
                ? 'Drag a card to another stage, or use its Stage menu.'
                : 'All candidates in a list.'}
            </p>
          </div>

          <div className="view-toggle" role="group" aria-label="Show candidates as">
            <button
              type="button"
              aria-pressed={view === 'board'}
              className={view === 'board' ? 'is-active' : ''}
              onClick={() => changeView('board')}
            >
              <Columns3 size={16} aria-hidden="true" /> Board
            </button>
            <button
              type="button"
              aria-pressed={view === 'table'}
              className={view === 'table' ? 'is-active' : ''}
              onClick={() => changeView('table')}
            >
              <List size={16} aria-hidden="true" /> Table
            </button>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, position or department…" />

          {view === 'table' && (
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {PIPELINE_STAGES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          )}
        </div>

        {view === 'board' ? (
          loading ? (
            <p className="ui-loading">Loading candidates…</p>
          ) : candidates.length === 0 ? (
            <EmptyState
              title="No candidates yet"
              description="Add a candidate to start your recruitment pipeline."
            />
          ) : (
            <PipelineBoard
              candidates={filteredCandidates}
              onMove={moveCandidate}
              onHire={setHiring}
              onOpen={setViewCandidate}
            />
          )
        ) : (
          <DataTable
            caption="Candidates"
            columns={columns}
            data={filteredCandidates}
            loading={loading}
            emptyState={
              <EmptyState
                title={isFiltered ? 'No candidates match' : 'No candidates yet'}
                description={
                  isFiltered
                    ? 'Try a different search or filter.'
                    : 'Add a candidate to start your recruitment pipeline.'
                }
              />
            }
          />
        )}
      </section>

      {showModal && (
        <Modal title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'} onClose={closeModal}>
          <form className="ui-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="candidateId">Candidate ID</label>
                <output id="candidateId" className="form-static">
                  {editingCandidate ? form.candidateId : 'Assigned automatically'}
                </output>
              </div>

              <div className="form-group">
                <label htmlFor="candidateName">Candidate Name</label>
                <input
                  id="candidateName"
                  name="candidateName"
                  value={form.candidateName}
                  onChange={handleChange}
                  required
                  placeholder="Candidate name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidateEmail">Email</label>
                <input
                  id="candidateEmail"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="candidate@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidatePhone">Phone</label>
                <input
                  id="candidatePhone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidatePosition">Position</label>
                <input
                  id="candidatePosition"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  required
                  placeholder="Software Engineer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidateDepartment">Department</label>
                <input
                  id="candidateDepartment"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                  placeholder="Engineering"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidateExperience">Experience (years)</label>
                <input
                  id="candidateExperience"
                  type="number"
                  min="0"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidateSource">Source</label>
                <input
                  id="candidateSource"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="LinkedIn"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidateApplied">Applied Date</label>
                <input
                  id="candidateApplied"
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidateStatus">Status</label>
                <select
                  id="candidateStatus"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={editingCandidate?.status === 'Hired'}
                  aria-describedby="candidateStatusHelp"
                >
                  {formStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <small id="candidateStatusHelp" className="hire-help">
                  {editingCandidate?.status === 'Hired'
                    ? `Hired as ${editingCandidate.employeeId || 'an employee'}.`
                    : 'To hire, choose Selected and then use the Hire button.'}
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="candidateNotes">Notes</label>
              <textarea
                id="candidateNotes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Additional candidate notes..."
              />
            </div>

            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>

              <Button type="submit" loading={saving}>
                {editingCandidate ? 'Update Candidate' : 'Add Candidate'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewCandidate && (
        <Modal title="Candidate Details" onClose={() => setViewCandidate(null)}>
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
              <strong>{viewCandidate.experience ?? 0} years</strong>
            </div>

            <div>
              <span className="detail-label">Source</span>
              <strong>{viewCandidate.source || '—'}</strong>
            </div>

            <div>
              <span className="detail-label">Status</span>
              <Badge>{viewCandidate.status}</Badge>
            </div>

            <div>
              <span className="detail-label">Applied Date</span>
              <strong>{formatDay(viewCandidate.appliedDate)}</strong>
            </div>

            {viewCandidate.status === 'Hired' && (
              <div>
                <span className="detail-label">Employee</span>
                <strong>
                  {viewCandidate.employeeId ? (
                    <Link to={`/employees/${viewCandidate.employeeId}`}>{viewCandidate.employeeId}</Link>
                  ) : '—'}
                  {viewCandidate.hiredAt && ` · hired ${formatDay(viewCandidate.hiredAt)}`}
                </strong>
              </div>
            )}
          </div>

          <div className="detail-notes">
            <span className="detail-label">Notes</span>
            <p>{viewCandidate.notes || 'No notes available.'}</p>
          </div>

          {viewCandidate.status === 'Selected' && (
            <div className="modal-actions">
              <Button
                icon={<UserCheck size={16} aria-hidden="true" />}
                onClick={() => {
                  setHiring(viewCandidate)
                  setViewCandidate(null)
                }}
              >
                Hire {viewCandidate.candidateName}
              </Button>
            </div>
          )}
        </Modal>
      )}

      {hiring && <HireModal candidate={hiring} onClose={() => setHiring(null)} onHired={handleHired} />}
    </div>
  )
}

export default Recruitment
