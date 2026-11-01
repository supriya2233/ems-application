import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, ClipboardCheck, Laptop, LogOut, Plus } from 'lucide-react'

import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import StatCard from '../components/common/StatCard'
import OffboardingCard from '../components/offboarding/OffboardingCard'
import StartOffboardingModal from '../components/offboarding/StartOffboardingModal'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import {
  deleteOffboarding,
  getOffboardings,
  setOffboardingItem,
  updateOffboarding,
} from '../services/offboardingService'
import { todayKey } from '../utils/leave'
import { OFFBOARDING_REASONS, OFFBOARDING_STATUSES, RETURN_CONDITIONS } from '../utils/offboarding'

const dayOf = (value) => (value ? String(new Date(value).toISOString()).slice(0, 10) : '')

function Offboarding() {
  const confirm = useConfirm()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const focusId = searchParams.get('focus')

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Open')

  const [showStart, setShowStart] = useState(false)
  const [editing, setEditing] = useState(null) // { record, lastWorkingDay, reason, notes }
  const [returning, setReturning] = useState(null) // { record, item, condition, note }
  const [busy, setBusy] = useState(null) // { id, key }
  const [saving, setSaving] = useState(false)

  // Asset hand-overs, payroll and employee changes elsewhere refresh this page.
  const refreshKey = useLiveRefresh(['offboarding', 'assets', 'employees'])

  useEffect(() => {
    let ignore = false

    getOffboardings()
      .then((data) => {
        if (!ignore) {
          setRecords(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load offboarding')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  // Coming from a profile (?focus=id): bring that card into view.
  useEffect(() => {
    if (loading || !focusId) return
    requestAnimationFrame(() => {
      document.getElementById(`offboarding-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [loading, focusId])

  const replace = (updated) =>
    setRecords((current) => current.map((record) => (record._id === updated._id ? updated : record)))

  /* ---------------- Summary & filters ---------------- */

  const today = todayKey()

  const summary = useMemo(() => {
    const open = records.filter((record) => record.status !== 'Completed')
    const soon = new Date(`${today}T00:00:00Z`)
    soon.setUTCDate(soon.getUTCDate() + 14)
    const soonKey = soon.toISOString().slice(0, 10)

    return {
      open: open.length,
      leavingSoon: open.filter((record) => dayOf(record.lastWorkingDay) >= today && dayOf(record.lastWorkingDay) <= soonKey).length,
      assets: open.reduce((sum, record) => sum + record.items.filter((item) => item.kind === 'asset' && !item.done).length, 0),
      completed: records.length - open.length,
    }
  }, [records, today])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        [record.offboardingId, record.employeeId, record.employeeName, record.department, record.reason]
          .some((field) => String(field || '').toLowerCase().includes(query))

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Open' ? record.status !== 'Completed' : record.status === statusFilter) ||
        record._id === focusId

      return matchesSearch && matchesStatus
    })
  }, [records, search, statusFilter, focusId])

  /* ---------------- Ticking ---------------- */

  const saveItem = async (record, item, done, extra = {}) => {
    setBusy({ id: record._id, key: item.key })
    try {
      const updated = await setOffboardingItem(record._id, item.key, { done, ...extra })
      replace(updated)
      toast.success(
        updated.status === 'Completed'
          ? `${record.employeeName}’s offboarding is complete. They are now Inactive.`
          : `${item.label} ${done ? 'ticked off' : 'reopened'}`,
      )
      return true
    } catch (err) {
      toast.error(err.message || 'Could not update the checklist')
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleToggle = async (record, item, done) => {
    if (item.kind === 'asset' && done) {
      setReturning({ record, item, condition: 'Good', note: '' })
      return
    }

    // The last item finishes everything, so say what will happen.
    const remaining = record.items.filter((entry) => !entry.done && entry.key !== item.key).length
    if (done && remaining === 0) {
      const ok = await confirm({
        title: `Finish offboarding ${record.employeeName}?`,
        message: 'This is the last item. They will be set to Inactive, and any asset still with them goes back to stock.',
        confirmLabel: 'Finish offboarding',
      })
      if (!ok) return
    }

    saveItem(record, item, done)
  }

  const confirmReturn = async (event) => {
    event.preventDefault()
    const { record, item, condition, note } = returning
    setSaving(true)
    const ok = await saveItem(record, item, true, { condition, note })
    setSaving(false)
    if (ok) setReturning(null)
  }

  /* ---------------- Edit / delete ---------------- */

  const openEdit = (record) =>
    setEditing({ record, lastWorkingDay: dayOf(record.lastWorkingDay), reason: record.reason, notes: record.notes || '' })

  const saveEdit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const { record, ...details } = editing
      const updated = await updateOffboarding(
        record._id,
        record.status === 'Completed' ? { notes: details.notes } : details,
      )
      replace(updated)
      setEditing(null)
      toast.success('Offboarding updated')
    } catch (err) {
      toast.error(err.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record) => {
    const ok = await confirm({
      title: 'Delete this offboarding?',
      message:
        record.status === 'Completed'
          ? `The record of ${record.employeeName}’s offboarding will be removed. They stay Inactive.`
          : `${record.employeeName}’s offboarding will be cancelled. Returned assets and any settlement already created stay as they are.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteOffboarding(record._id)
      setRecords((current) => current.filter((item) => item._id !== record._id))
      toast.success('Offboarding deleted')
    } catch (err) {
      toast.error(err.message || 'Could not delete')
    }
  }

  const isFiltered = search || statusFilter !== 'Open'

  return (
    <div className="offboarding-page">
      <PageHeader
        title="Offboarding"
        description="Checklists for people leaving: collect assets, hand over work and settle the final pay."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={() => setShowStart(true)}>
            Start offboarding
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Offboarding at a glance">
        <StatCard
          title="Leaving"
          value={summary.open}
          icon={<LogOut size={16} aria-hidden="true" />}
          description="checklists not finished"
        />
        <StatCard
          title="Last day soon"
          value={summary.leavingSoon}
          icon={<CalendarClock size={16} aria-hidden="true" />}
          warning={summary.leavingSoon > 0}
          description="in the next 14 days"
        />
        <StatCard
          title="Assets to collect"
          value={summary.assets}
          icon={<Laptop size={16} aria-hidden="true" />}
          warning={summary.assets > 0}
          description="still with people leaving"
        />
        <StatCard
          title="Completed"
          value={summary.completed}
          icon={<ClipboardCheck size={16} aria-hidden="true" />}
          description="now inactive"
        />
      </section>

      <section className="ui-card onboarding-panel" aria-labelledby="offboarding-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="offboarding-title">Checklists</h2>
            <p>Tick each item as it’s done; the last one sets the person to Inactive.</p>
          </div>
          <span className="leave-count">{filtered.length} shown</span>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, ID, department or reason…" />
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="Open">Not finished</option>
            <option value="All">All</option>
            {OFFBOARDING_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="ui-loading">Loading offboarding…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<LogOut size={20} aria-hidden="true" />}
            title={isFiltered ? 'Nobody matches' : 'Nobody is leaving'}
            description={
              isFiltered
                ? 'Try a different search or filter.'
                : 'Start offboarding here or from the person’s profile when someone resigns or their contract ends.'
            }
            action={!isFiltered && <Link to="/employees" className="ui-button ui-button-secondary">Go to Employees</Link>}
          />
        ) : (
          <div className="onboarding-grid">
            {filtered.map((record) => (
              <OffboardingCard
                key={record._id}
                record={record}
                busyKey={busy?.id === record._id ? busy.key : null}
                highlighted={record._id === focusId}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {showStart && (
        <StartOffboardingModal
          onClose={() => setShowStart(false)}
          onStarted={(record) => {
            setRecords((current) => [...current, record])
            setShowStart(false)
          }}
        />
      )}

      {returning && (
        <Modal title={`Return ${returning.item.label.replace(/^Return /, '')}`} onClose={() => !saving && setReturning(null)} size="sm">
          <form onSubmit={confirmReturn}>
            <p className="hire-intro">
              <Laptop size={18} aria-hidden="true" />
              <span>Back from {returning.record.employeeName}. Damaged items go to Under Maintenance; the rest are available again.</span>
            </p>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="return-condition">Condition</label>
                <select
                  id="return-condition"
                  value={returning.condition}
                  onChange={(event) => setReturning((current) => ({ ...current, condition: event.target.value }))}
                >
                  {RETURN_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="return-note">Note</label>
                <input
                  id="return-note"
                  value={returning.note}
                  onChange={(event) => setReturning((current) => ({ ...current, note: event.target.value }))}
                  placeholder="e.g. charger missing"
                />
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setReturning(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>Mark as returned</Button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.record.employeeName}’s offboarding`} onClose={() => !saving && setEditing(null)}>
          <form onSubmit={saveEdit}>
            {editing.record.status === 'Completed' && (
              <p className="hire-intro"><span>This offboarding is finished, so only the notes can change.</span></p>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-last-day">Last working day</label>
                <input
                  id="edit-last-day"
                  type="date"
                  value={editing.lastWorkingDay}
                  disabled={editing.record.status === 'Completed'}
                  onChange={(event) => setEditing((current) => ({ ...current, lastWorkingDay: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-reason">Reason</label>
                <select
                  id="edit-reason"
                  value={editing.reason}
                  disabled={editing.record.status === 'Completed'}
                  onChange={(event) => setEditing((current) => ({ ...current, reason: event.target.value }))}
                >
                  {OFFBOARDING_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="edit-notes">Notes</label>
                <textarea
                  id="edit-notes"
                  rows="3"
                  value={editing.notes}
                  onChange={(event) => setEditing((current) => ({ ...current, notes: event.target.value }))}
                />
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Offboarding
