import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, CircleAlert, ClipboardCheck, ListChecks, Plus } from 'lucide-react'

import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import EmployeePicker from '../components/common/EmployeePicker'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'
import EquipmentStepModal from '../components/onboarding/EquipmentStepModal'
import OnboardingCard from '../components/onboarding/OnboardingCard'
import {
  getOnboardingRecords,
  createOnboarding,
  updateOnboarding,
  deleteOnboarding,
  setOnboardingStep,
} from '../services/onboardingService'
import { getAssets } from '../services/assetService'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { formatDay, todayKey } from '../utils/leave'
import {
  checklistOf,
  ONBOARDING_STATUSES,
  ONBOARDING_STEPS,
  ONBOARDING_TYPES,
} from '../utils/onboarding'

const initialForm = {
  onboardingId: '',
  employeeId: '',
  employeeName: '',
  department: '',
  joiningDate: '',
  onboardingType: 'New Hire',
  documents: false,
  orientation: false,
  equipment: false,
  systemAccess: false,
  notes: '',
}

const dayOf = (value) => (value ? String(new Date(value).toISOString()).slice(0, 10) : '')

function Onboarding() {
  const confirm = useConfirm()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const focusId = searchParams.get('focus')

  const [records, setRecords] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Open')

  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const [busy, setBusy] = useState(null) // { id, step } while a step saves
  const [equipmentFor, setEquipmentFor] = useState(null)

  // Hires, ticks in another tab, and asset hand-overs refresh the page.
  const refreshKey = useLiveRefresh(['onboarding', 'employees', 'assets'])

  useEffect(() => {
    let ignore = false

    Promise.all([getOnboardingRecords(), getAssets().catch(() => [])])
      .then(([data, assetList]) => {
        if (!ignore) {
          setRecords(data)
          setAssets(assetList)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load onboarding records')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  // Coming from Approvals (?focus=id): show that card, even if finished.
  useEffect(() => {
    if (loading || !focusId) return
    const record = records.find((item) => item._id === focusId)
    if (record?.status === 'Completed') setStatusFilter('All')
    requestAnimationFrame(() => {
      document.getElementById(`onboarding-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [loading, focusId, records])

  const replace = (updated) =>
    setRecords((current) => current.map((record) => (record._id === updated._id ? updated : record)))

  const assetById = useMemo(
    () => Object.fromEntries(assets.map((asset) => [asset._id, asset])),
    [assets],
  )

  /* ---------------- Summary & filters ---------------- */

  const today = todayKey()

  const summary = useMemo(() => {
    const open = records.filter((record) => record.status !== 'Completed')
    const soon = new Date(`${today}T00:00:00Z`)
    soon.setUTCDate(soon.getUTCDate() + 14)
    const soonKey = soon.toISOString().slice(0, 10)

    return {
      open: open.length,
      overdue: open.reduce((sum, record) => sum + checklistOf(record, today).filter((step) => step.overdue).length, 0),
      joiningSoon: open.filter((record) => dayOf(record.joiningDate) >= today && dayOf(record.joiningDate) <= soonKey).length,
      completed: records.length - open.length,
    }
  }, [records, today])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records
      .filter((record) => {
        const matchesSearch =
          !query ||
          [record.onboardingId, record.employeeId, record.employeeName, record.department]
            .some((field) => String(field || '').toLowerCase().includes(query))

        const matchesStatus =
          statusFilter === 'All' ||
          (statusFilter === 'Open' ? record.status !== 'Completed' : record.status === statusFilter)

        return matchesSearch && matchesStatus
      })
      // Soonest joiners first
      .sort((a, b) => new Date(a.joiningDate) - new Date(b.joiningDate))
  }, [records, search, statusFilter])

  /* ---------------- Ticking steps ---------------- */

  const saveStep = async (record, step, done, assetId) => {
    setBusy({ id: record._id, step })
    try {
      const updated = await setOnboardingStep(record._id, step, { done, assetId })
      replace(updated)

      if (assetId) {
        // The asset is now assigned; refresh the list for its name.
        getAssets().then(setAssets).catch(() => {})
      }

      if (updated.status === 'Completed' && record.status !== 'Completed') {
        toast.success(`${record.employeeName}’s onboarding is complete`)
      } else {
        const label = ONBOARDING_STEPS.find((item) => item.key === step)?.label
        toast.success(`${label} ${done ? 'ticked off' : 'reopened'} for ${record.employeeName}`)
      }
      return true
    } catch (err) {
      toast.error(err.message || 'Could not update the step')
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleToggle = (record, step, done) => {
    // Ticking equipment first asks which asset to hand over.
    if (step === 'equipment' && done) {
      setEquipmentFor(record)
      return
    }
    saveStep(record, step, done)
  }

  /* ---------------- Add / edit / delete ---------------- */

  const openAddModal = () => {
    setEditingRecord(null)
    setForm({ ...initialForm })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)

    setForm({
      onboardingId: record.onboardingId || '',
      employeeId: record.employeeId || '',
      employeeName: record.employeeName || '',
      department: record.department || '',
      joiningDate: dayOf(record.joiningDate),
      onboardingType: record.onboardingType || 'New Hire',
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

  // The server copies the employee's name and department on save;
  // they are mirrored here so the form shows them straight away.
  const handleEmployeeChange = (employee) => {
    setForm((current) => ({
      ...current,
      employeeId: employee?.employeeId || '',
      employeeName: employee?.name || '',
      department: employee?.department || '',
      // A new hire's onboarding starts on their joining date.
      joiningDate:
        employee?.joiningDate && !current.joiningDate
          ? employee.joiningDate.split('T')[0]
          : current.joiningDate,
    }))
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
        const updated = await updateOnboarding(editingRecord._id, form)
        replace(updated)
        toast.success('Onboarding updated')
      } else {
        const created = await createOnboarding(form)
        setRecords((current) => [created, ...current])
        toast.success(`Onboarding started for ${created.employeeName}`)
      }

      setSaving(false)
      setShowModal(false)
      setEditingRecord(null)
      setForm(initialForm)
    } catch (err) {
      setError(err.message || 'Failed to save onboarding record')
      setSaving(false)
    }
  }

  const handleDelete = async (record) => {
    const confirmed = await confirm({
      title: 'Delete onboarding record?',
      message: `The onboarding record for ${record.employeeName} will be permanently removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })

    if (!confirmed) return

    try {
      setError('')
      await deleteOnboarding(record._id)
      setRecords((current) => current.filter((item) => item._id !== record._id))
      toast.success('Onboarding record deleted')
    } catch (err) {
      setError(err.message || 'Failed to delete onboarding record')
    }
  }

  const isFiltered = search || statusFilter !== 'Open'

  return (
    <div className="onboarding-page">
      <PageHeader
        title="Onboarding"
        description="Checklists for new joiners. Each step has a due date, and the status follows the checklist."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={openAddModal}>
            Start onboarding
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Onboarding at a glance">
        <StatCard
          title="In onboarding"
          value={summary.open}
          icon={<ListChecks size={16} aria-hidden="true" />}
          description="not finished yet"
        />
        <StatCard
          title="Overdue steps"
          value={summary.overdue}
          icon={<CircleAlert size={16} aria-hidden="true" />}
          warning={summary.overdue > 0}
          description={summary.overdue > 0 ? <Link to="/approvals">See them in Approvals</Link> : 'Everything on time'}
        />
        <StatCard
          title="Joining soon"
          value={summary.joiningSoon}
          icon={<CalendarClock size={16} aria-hidden="true" />}
          description="in the next 14 days"
        />
        <StatCard
          title="Completed"
          value={summary.completed}
          icon={<ClipboardCheck size={16} aria-hidden="true" />}
          description="all steps done"
        />
      </section>

      <section className="ui-card onboarding-panel" aria-labelledby="onboarding-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="onboarding-title">Checklists</h2>
            <p>Tick a step as soon as it’s done; it saves straight away.</p>
          </div>
          <span className="leave-count">{filteredRecords.length} shown</span>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, ID or department…" />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="Open">Not finished</option>
            <option value="All">All</option>
            {ONBOARDING_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="ui-loading">Loading onboarding…</p>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title={isFiltered ? 'Nobody matches' : 'Nobody is onboarding'}
            description={
              isFiltered
                ? 'Try a different search or filter.'
                : 'Hire a selected candidate on the Recruitment page, or start onboarding for an existing employee.'
            }
            action={!isFiltered && <Link to="/recruitment" className="ui-button ui-button-secondary">Go to Recruitment</Link>}
          />
        ) : (
          <div className="onboarding-grid">
            {filteredRecords.map((record) => (
              <OnboardingCard
                key={record._id}
                record={record}
                asset={assetById[record.equipmentAssetId]}
                busyStep={busy?.id === record._id ? busy.step : null}
                highlighted={record._id === focusId}
                onToggle={handleToggle}
                onView={setViewRecord}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {equipmentFor && (
        <EquipmentStepModal
          record={equipmentFor}
          onClose={() => setEquipmentFor(null)}
          onConfirm={async (assetId) => {
            const ok = await saveStep(equipmentFor, 'equipment', true, assetId || undefined)
            if (ok) setEquipmentFor(null)
            return ok
          }}
        />
      )}

      {showModal && (
        <Modal title={editingRecord ? 'Edit Onboarding' : 'Start Onboarding'} onClose={closeModal}>
          <form className="ui-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="onboardingId">Onboarding ID</label>
                <output id="onboardingId" className="form-static">
                  {editingRecord ? form.onboardingId : 'Assigned automatically'}
                </output>
              </div>

              <div className="form-group">
                <label htmlFor="employee-picker">Employee</label>
                <EmployeePicker
                  id="employee-picker"
                  value={form.employeeId}
                  onChange={handleEmployeeChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="employee-department">Department</label>
                <output id="employee-department" className="form-static">
                  {form.department || 'Filled in from the employee'}
                </output>
              </div>

              <div className="form-group">
                <label htmlFor="onboarding-joining">Joining Date</label>
                <input
                  id="onboarding-joining"
                  type="date"
                  name="joiningDate"
                  value={form.joiningDate}
                  onChange={handleChange}
                  required
                  aria-describedby="onboarding-joining-help"
                />
                <small id="onboarding-joining-help" className="hire-help">
                  Step due dates are worked out from this date.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="onboarding-type">Onboarding Type</label>
                <select
                  id="onboarding-type"
                  name="onboardingType"
                  value={form.onboardingType}
                  onChange={handleChange}
                >
                  {ONBOARDING_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="onboarding-checklist">
              <legend>Checklist</legend>
              <p className="hire-help">The status is set from these: none ticked is Not Started, all four is Completed.</p>

              {ONBOARDING_STEPS.map((step) => (
                <label key={step.key} className="checkbox-row">
                  <input
                    type="checkbox"
                    name={step.key}
                    checked={form[step.key]}
                    onChange={handleChange}
                  />
                  <span>{step.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="form-group">
              <label htmlFor="onboarding-notes">Notes</label>
              <textarea
                id="onboarding-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Additional onboarding notes..."
              />
            </div>

            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>

              <Button type="submit" loading={saving}>
                {editingRecord ? 'Update Onboarding' : 'Start Onboarding'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewRecord && (
        <Modal title="Onboarding Details" onClose={() => setViewRecord(null)}>
          <div className="detail-grid">
            <div>
              <span className="detail-label">Onboarding ID</span>
              <strong>{viewRecord.onboardingId}</strong>
            </div>

            <div>
              <span className="detail-label">Employee ID</span>
              <strong>{viewRecord.employeeId}</strong>
            </div>

            <div>
              <span className="detail-label">Employee Name</span>
              <strong>{viewRecord.employeeName}</strong>
            </div>

            <div>
              <span className="detail-label">Department</span>
              <strong>{viewRecord.department}</strong>
            </div>

            <div>
              <span className="detail-label">Joining Date</span>
              <strong>{formatDay(viewRecord.joiningDate)}</strong>
            </div>

            <div>
              <span className="detail-label">Type</span>
              <strong>{viewRecord.onboardingType}</strong>
            </div>

            <div>
              <span className="detail-label">Status</span>
              <Badge>{viewRecord.status}</Badge>
            </div>

            {viewRecord.candidateId && (
              <div>
                <span className="detail-label">Hired from</span>
                <strong>Candidate {viewRecord.candidateId}</strong>
              </div>
            )}
          </div>

          <ul className="onboarding-view-steps">
            {checklistOf(viewRecord, today).map((step) => (
              <li key={step.key}>
                <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
                <span>{step.label}</span>
                <span className="onboarding-step-when">
                  {step.done
                    ? step.completedAt ? `done ${formatDay(step.completedAt)}` : 'done'
                    : `${step.overdue ? 'overdue, ' : ''}due ${formatDay(step.dueKey)}`}
                </span>
              </li>
            ))}
          </ul>

          <div className="detail-notes">
            <span className="detail-label">Notes</span>
            <p>{viewRecord.notes || 'No notes available.'}</p>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Onboarding
