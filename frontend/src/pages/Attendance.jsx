import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Home, Plus, UserX } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import DataTable from '../components/common/DataTable'
import EmployeePicker from '../components/common/EmployeePicker'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  updateAttendance,
} from '../services/attendanceService'
import { getEmployees } from '../services/employeeService'
import { localDayKey } from '../utils/activity'

// 'On Leave' is filled in automatically from approved leave.
const STATUSES = ['Present', 'Late', 'Absent', 'WFH', 'On Leave']

const STATUS_TONE = {
  Present: 'success',
  Late: 'warning',
  Absent: 'danger',
  'On Leave': 'info',
  WFH: 'neutral',
}

const emptyForm = (date) => ({
  employeeId: '',
  employeeName: '',
  department: '',
  date,
  status: 'Present',
  checkIn: '',
  checkOut: '',
  hours: '',
})

// "2026-11-01" + n days → "2026-11-02" (local calendar days)
function shiftDay(key, days) {
  const [year, month, day] = key.split('-').map(Number)
  return localDayKey(new Date(year, month - 1, day + days))
}

function displayDay(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Attendance() {
  const confirm = useConfirm()
  const toast = useToast()

  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = localDayKey(new Date())
  const [day, setDay] = useState(today)
  const [statusFilter, setStatusFilter] = useState('All')
  const [department, setDepartment] = useState('All')

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  // Approving leave fills in "On Leave" days, so listen to leave too.
  const refreshKey = useLiveRefresh(['attendance', 'leave', 'employees'])

  useEffect(() => {
    let ignore = false

    Promise.all([getAttendance(), getEmployees()])
      .then(([attendanceData, employeeData]) => {
        if (ignore) return
        setAttendance(attendanceData)
        setEmployees(employeeData)
        setError('')
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load attendance')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  /* ---------------- The selected day ---------------- */

  // Records are stored per calendar day (UTC midnight), so compare
  // the stored day, not the local time.
  const dayRecords = useMemo(
    () => attendance.filter((record) => record.date && String(record.date).slice(0, 10) === day),
    [attendance, day],
  )

  const summary = useMemo(() => {
    const count = (status) => dayRecords.filter((record) => record.status === status).length
    const marked = new Set(dayRecords.map((record) => record.employeeId))
    const expected = employees.filter((employee) => employee.status === 'Active' || employee.status === 'On Leave')
    return {
      present: count('Present'),
      late: count('Late'),
      absent: count('Absent'),
      wfh: count('WFH'),
      onLeave: count('On Leave'),
      notMarked: expected.filter((employee) => !marked.has(employee.employeeId)).length,
    }
  }, [dayRecords, employees])

  const departmentOptions = useMemo(
    () => [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(),
    [employees],
  )

  const rows = useMemo(
    () =>
      dayRecords
        .filter(
          (record) =>
            (statusFilter === 'All' || record.status === statusFilter) &&
            (department === 'All' || record.department === department),
        )
        .sort((a, b) => String(a.employeeName).localeCompare(String(b.employeeName))),
    [dayRecords, statusFilter, department],
  )

  /* ---------------- Actions ---------------- */

  const handleStatusChange = async (record, status) => {
    try {
      const updated = await updateAttendance(record._id, { status })
      setAttendance((current) => current.map((item) => (item._id === record._id ? updated : item)))
      toast.success(`${record.employeeName}: ${status}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance')
    }
  }

  const handleDelete = async (record) => {
    const ok = await confirm({
      title: 'Delete attendance record?',
      message: `${record.employeeName}’s record for ${displayDay(day)} will be permanently removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteAttendance(record._id)
      setAttendance((current) => current.filter((item) => item._id !== record._id))
      toast.success('Attendance record deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete attendance')
    }
  }

  const setField = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.employeeId) {
      toast.error('Please choose an employee.')
      return
    }

    setSaving(true)
    try {
      const created = await createAttendance(form)
      setAttendance((current) => [created, ...current])
      toast.success(`${created.employeeName} marked ${created.status}`)
      if (form.date !== day) setDay(form.date)
      setForm(null)
    } catch (err) {
      toast.error(err.message || 'Failed to mark attendance')
    } finally {
      setSaving(false)
    }
  }

  /* ---------------- Table ---------------- */

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (record) => (
        <>
          <Link className="table-primary person-link" to={`/employees/${record.employeeId}`}>{record.employeeName}</Link>
          <div className="table-secondary">{record.employeeId} · {record.department}</div>
        </>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (record) => <Badge variant={STATUS_TONE[record.status] || 'neutral'}>{record.status}</Badge>,
    },
    { key: 'checkIn', label: 'Check in', render: (record) => record.checkIn || '—' },
    { key: 'checkOut', label: 'Check out', render: (record) => record.checkOut || '—' },
    { key: 'hours', label: 'Hours', render: (record) => record.hours || '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (record) => (
        <div className="table-actions">
          <select
            className="table-select"
            aria-label={`Change status for ${record.employeeName}`}
            value={record.status}
            onChange={(event) => handleStatusChange(record, event.target.value)}
          >
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <Button size="small" variant="ghost" onClick={() => handleDelete(record)} aria-label={`Delete ${record.employeeName}’s record`}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = statusFilter !== 'All' || department !== 'All'

  /* ---------------- Page ---------------- */

  return (
    <div className="attendance-page-v2">
      <PageHeader
        title="Attendance"
        description="Who was in, late, remote or away on any day. Approved leave fills itself in."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={() => setForm(emptyForm(day))}>
            Mark attendance
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <div className="day-bar">
        <div className="day-bar-nav" role="group" aria-label="Choose day">
          <Button variant="secondary" size="small" icon={<ChevronLeft size={16} aria-hidden="true" />} onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day" />
          <label className="visually-hidden" htmlFor="attendance-day">Day</label>
          <input id="attendance-day" type="date" value={day} onChange={(event) => event.target.value && setDay(event.target.value)} />
          <Button variant="secondary" size="small" icon={<ChevronRight size={16} aria-hidden="true" />} onClick={() => setDay(shiftDay(day, 1))} aria-label="Next day" />
          <Button variant="ghost" size="small" onClick={() => setDay(today)} disabled={day === today}>Today</Button>
        </div>

        <div className="day-bar-text" aria-live="polite">
          <strong>{displayDay(day)}</strong>
          <span>
            {summary.onLeave} on leave · {summary.notMarked} not marked
          </span>
        </div>
      </div>

      <section className="stats-grid" aria-label={`Attendance on ${displayDay(day)}`}>
        <StatCard title="Present" value={summary.present} icon={<CalendarCheck size={16} aria-hidden="true" />} description="in the office" />
        <StatCard title="Late" value={summary.late} icon={<Clock size={16} aria-hidden="true" />} warning={summary.late > 0} description="arrived late" />
        <StatCard title="Absent" value={summary.absent} icon={<UserX size={16} aria-hidden="true" />} warning={summary.absent > 0} description="counts as unpaid in payroll" />
        <StatCard title="Work from home" value={summary.wfh} icon={<Home size={16} aria-hidden="true" />} description="working remotely" />
      </section>

      <section className="ui-card" aria-labelledby="attendance-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="attendance-title">Daily attendance</h2>
            <p>{dayRecords.length} {dayRecords.length === 1 ? 'record' : 'records'} for this day</p>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="All">All departments</option>
            {departmentOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <DataTable
          caption={`Attendance on ${displayDay(day)}`}
          columns={columns}
          data={rows}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<CalendarCheck size={20} aria-hidden="true" />}
              title={isFiltered ? 'No records match' : 'Nothing recorded for this day'}
              description={isFiltered ? 'Try a different status or department.' : 'Mark attendance, or pick another day.'}
              action={!isFiltered && <Button onClick={() => setForm(emptyForm(day))}>Mark attendance</Button>}
            />
          }
        />
      </section>

      {form && (
        <Modal title="Mark attendance" onClose={() => !saving && setForm(null)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group form-full-width">
                <label htmlFor="attendance-employee">Employee</label>
                <EmployeePicker
                  id="attendance-employee"
                  value={form.employeeId}
                  required
                  onChange={(employee) =>
                    setForm((current) => ({
                      ...current,
                      employeeId: employee?.employeeId || '',
                      employeeName: employee?.name || '',
                      department: employee?.department || '',
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="attendance-date">Date</label>
                <input id="attendance-date" type="date" value={form.date} onChange={setField('date')} required />
              </div>

              <div className="form-group">
                <label htmlFor="attendance-status">Status</label>
                <select id="attendance-status" value={form.status} onChange={setField('status')}>
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="attendance-in">Check in</label>
                <input id="attendance-in" value={form.checkIn} onChange={setField('checkIn')} placeholder="09:00 AM" />
              </div>

              <div className="form-group">
                <label htmlFor="attendance-out">Check out</label>
                <input id="attendance-out" value={form.checkOut} onChange={setField('checkOut')} placeholder="05:30 PM" />
              </div>

              <div className="form-group">
                <label htmlFor="attendance-hours">Hours</label>
                <input id="attendance-hours" value={form.hours} onChange={setField('hours')} placeholder="8h 30m" />
              </div>
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving} disabled={!form.employeeId}>Mark attendance</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Attendance
