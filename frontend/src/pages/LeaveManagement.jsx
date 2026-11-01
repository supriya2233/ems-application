import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CalendarDays, Inbox, Plane, Plus } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import DataTable from '../components/common/DataTable'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import StatCard from '../components/common/StatCard'
import LeaveRequestModal from '../components/leave/LeaveRequestModal'
import { useLeaveActions } from '../components/leave/useLeaveActions'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { deleteLeave, getLeaves } from '../services/leaveService'
import { LEAVE_STATUSES, LEAVE_TYPES, formatDay, formatRange, plural, todayKey } from '../utils/leave'

const dayOf = (value) => String(value || '').slice(0, 10)

function LeaveManagement() {
  const confirm = useConfirm()
  const toast = useToast()
  const { approve, reject, cancel } = useLeaveActions()

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  // Reload when leave or employees change in another tab.
  const refreshKey = useLiveRefresh(['leave', 'employees'])

  useEffect(() => {
    let ignore = false

    getLeaves()
      .then((data) => {
        if (!ignore) {
          setLeaves(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load leave requests')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const replace = (updated) => {
    if (!updated) return
    setLeaves((current) => current.map((leave) => (leave._id === updated._id ? updated : leave)))
  }

  /* ---------------- Summary ---------------- */

  const today = todayKey()
  const year = Number(today.slice(0, 4))

  const summary = useMemo(() => {
    const active = (leave) => leave.status === 'Approved'

    return {
      pending: leaves.filter((leave) => leave.status === 'Pending').length,
      offToday: leaves.filter(
        (leave) => active(leave) && dayOf(leave.from) <= today && dayOf(leave.to) >= today,
      ).length,
      upcoming: leaves.filter((leave) => active(leave) && dayOf(leave.from) > today).length,
      daysThisYear: leaves
        .filter((leave) => active(leave) && new Date(leave.from).getUTCFullYear() === year)
        .reduce((sum, leave) => sum + Number(leave.days || 0), 0),
    }
  }, [leaves, today, year])

  const upcomingLeaves = useMemo(
    () =>
      leaves
        .filter((leave) => leave.status === 'Approved' && dayOf(leave.to) >= today)
        .sort((a, b) => new Date(a.from) - new Date(b.from))
        .slice(0, 5),
    [leaves, today],
  )

  /* ---------------- Filters ---------------- */

  const filteredLeaves = useMemo(() => {
    const text = search.trim().toLowerCase()

    return leaves
      .filter((leave) => {
        const matchesSearch =
          !text ||
          [leave.employee, leave.employeeId, leave.department, leave.reason].some((field) =>
            String(field || '').toLowerCase().includes(text),
          )
        const matchesStatus = statusFilter === 'All' || leave.status === statusFilter
        const matchesType = typeFilter === 'All' || leave.type === typeFilter

        return matchesSearch && matchesStatus && matchesType
      })
      // Pending first, then newest dates first
      .sort((a, b) => {
        if ((a.status === 'Pending') !== (b.status === 'Pending')) {
          return a.status === 'Pending' ? -1 : 1
        }
        return new Date(b.from) - new Date(a.from)
      })
  }, [leaves, search, statusFilter, typeFilter])

  /* ---------------- Delete ---------------- */

  const handleDelete = async (leave) => {
    const ok = await confirm({
      title: 'Delete leave request?',
      message: `${leave.employee}’s ${leave.type} leave (${formatRange(leave.from, leave.to)}) will be permanently removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteLeave(leave._id)
      setLeaves((current) => current.filter((item) => item._id !== leave._id))
      toast.success('Leave request deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete leave request')
    }
  }

  /* ---------------- Table ---------------- */

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (leave) => (
        <>
          <div className="table-primary">
            <Link className="employee-profile-link" to={`/employees/${leave.employeeId}`}>
              {leave.employee}
            </Link>
          </div>
          <div className="table-secondary">{leave.department}</div>
        </>
      ),
    },
    { key: 'type', label: 'Type' },
    {
      key: 'dates',
      label: 'Dates',
      render: (leave) => (
        <>
          <div className="table-primary">{formatRange(leave.from, leave.to)}</div>
          <div className="table-secondary">{plural(leave.days, 'working day')}</div>
        </>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (leave) => <span className="leave-reason">{leave.reason}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (leave) => <Badge>{leave.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (leave) => (
        <div className="table-actions">
          {leave.status === 'Pending' && (
            <>
              <Button size="small" onClick={async () => replace(await approve(leave))}>
                Approve
              </Button>
              <Button size="small" variant="secondary" onClick={async () => replace(await reject(leave))}>
                Reject
              </Button>
            </>
          )}

          {leave.status === 'Approved' && dayOf(leave.to) >= today && (
            <Button size="small" variant="secondary" onClick={async () => replace(await cancel(leave))}>
              Cancel
            </Button>
          )}

          <Button
            size="small"
            variant="ghost"
            aria-label={`Delete ${leave.employee}’s ${leave.type} leave`}
            onClick={() => handleDelete(leave)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = search || statusFilter !== 'All' || typeFilter !== 'All'

  return (
    <div className="leave-page">
      <PageHeader
        title="Leave Management"
        description="Requests, approvals and who is away. Days are counted as working days."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={() => setShowModal(true)}>
            Request leave
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Leave at a glance">
        <StatCard
          title="Waiting for approval"
          value={summary.pending}
          icon={<Inbox size={16} aria-hidden="true" />}
          warning={summary.pending > 0}
          description={summary.pending > 0 ? <Link to="/approvals">Review in Approvals</Link> : 'Nothing to review'}
        />
        <StatCard
          title="Off today"
          value={summary.offToday}
          icon={<Plane size={16} aria-hidden="true" />}
          description={summary.offToday === 1 ? 'person away' : 'people away'}
        />
        <StatCard
          title="Upcoming"
          value={summary.upcoming}
          icon={<CalendarClock size={16} aria-hidden="true" />}
          description="approved, not started yet"
        />
        <StatCard
          title={`Days taken in ${year}`}
          value={summary.daysThisYear}
          icon={<CalendarDays size={16} aria-hidden="true" />}
          description="approved working days"
        />
      </section>

      <div className="leave-layout">
        <section className="ui-card leave-requests" aria-labelledby="leave-requests-title">
          <div className="leave-section-header">
            <h2 id="leave-requests-title">Requests</h2>
            <span className="leave-count">{filteredLeaves.length} shown</span>
          </div>

          <div className="leave-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, ID, department or reason…" />

            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All statuses</option>
              {LEAVE_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select aria-label="Filter by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="All">All types</option>
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <DataTable
            caption="Leave requests"
            columns={columns}
            data={filteredLeaves}
            loading={loading}
            emptyState={
              <EmptyState
                title={isFiltered ? 'No requests match' : 'No leave requests yet'}
                description={
                  isFiltered
                    ? 'Try a different search or filter.'
                    : 'Requests appear here once someone asks for time off.'
                }
              />
            }
          />
        </section>

        <aside className="ui-card leave-upcoming" aria-labelledby="leave-upcoming-title">
          <div className="leave-section-header">
            <h2 id="leave-upcoming-title">Away now and next</h2>
            <Link to="/calendar" className="leave-link">Calendar</Link>
          </div>

          {upcomingLeaves.length === 0 ? (
            <p className="leave-muted">No approved leave coming up.</p>
          ) : (
            <ul className="leave-upcoming-list">
              {upcomingLeaves.map((leave) => {
                const now = dayOf(leave.from) <= today
                return (
                  <li key={leave._id}>
                    <div>
                      <strong>{leave.employee}</strong>
                      <span>
                        {leave.type} · {plural(leave.days, 'day')}
                      </span>
                    </div>
                    <div className="leave-upcoming-when">
                      {now ? <Badge variant="warning">Away now</Badge> : <span>{formatDay(leave.from, false)}</span>}
                      <span>until {formatDay(leave.to, false)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>

      <LeaveRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(created) => setLeaves((current) => [created, ...current])}
      />
    </div>
  )
}

export default LeaveManagement
