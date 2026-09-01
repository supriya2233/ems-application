import { useEffect, useMemo, useState } from 'react'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from '../services/attendanceService'

const statusOptions = [
  'All',
  'Present',
  'Late',
  'Absent',
  'WFH',
]

const departmentOptions = [
  'All Departments',
  'Engineering',
  'Design',
  'Management',
  'Human Resources',
  'Finance',
  'Marketing',
]

function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filter, setFilter] = useState('All')
  const [department, setDepartment] =
    useState('All Departments')

  const [selectedDate, setSelectedDate] =
    useState(new Date())

  const [showModal, setShowModal] =
    useState(false)

  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    department: '',
    date: '',
    status: 'Present',
    checkIn: '',
    checkOut: '',
    hours: '',
  })

  // ==========================================
  // LOAD ATTENDANCE
  // ==========================================

  const loadAttendance = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getAttendance()

      setAttendance(data)
    } catch (error) {
      setError(
        error.message ||
          'Failed to load attendance',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [])

  // ==========================================
  // DATE HELPERS
  // ==========================================

  const formatDateForInput = (date) => {
    const year = date.getFullYear()

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, '0')

    const day = String(
      date.getDate(),
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (date) => {
    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    )
  }

  const formatTime = (time) => {
    return time || '—'
  }

  // ==========================================
  // SELECTED DATE RECORDS
  // ==========================================

  const selectedDateString =
    formatDateForInput(selectedDate)

  const selectedDateAttendance =
    useMemo(() => {
      return attendance.filter((record) => {
        if (!record.date) {
          return false
        }

        return (
          formatDateForInput(
            new Date(record.date),
          ) === selectedDateString
        )
      })
    }, [attendance, selectedDateString])

  // ==========================================
  // FILTERED RECORDS
  // ==========================================

  const filteredEmployees =
    useMemo(() => {
      return selectedDateAttendance.filter(
        (employee) => {
          const statusMatch =
            filter === 'All' ||
            employee.status === filter

          const departmentMatch =
            department ===
              'All Departments' ||
            employee.department ===
              department

          return (
            statusMatch &&
            departmentMatch
          )
        },
      )
    }, [
      selectedDateAttendance,
      filter,
      department,
    ])

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    return {
      present:
        selectedDateAttendance.filter(
          (record) =>
            record.status === 'Present',
        ).length,

      late:
        selectedDateAttendance.filter(
          (record) =>
            record.status === 'Late',
        ).length,

      absent:
        selectedDateAttendance.filter(
          (record) =>
            record.status === 'Absent',
        ).length,

      wfh:
        selectedDateAttendance.filter(
          (record) =>
            record.status === 'WFH',
        ).length,
    }
  }, [selectedDateAttendance])

  // ==========================================
  // TABLE COLUMNS
  // ==========================================

  const columns = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (employee) => (
        <strong>
          {employee.employeeName}
        </strong>
      ),
    },

    {
      key: 'department',
      label: 'Department',
    },

    {
      key: 'status',
      label: 'Status',
      render: (employee) => (
        <Badge
          variant={getStatusVariant(
            employee.status,
          )}
        >
          {employee.status}
        </Badge>
      ),
    },

    {
      key: 'checkIn',
      label: 'Check In',
      render: (employee) =>
        formatTime(employee.checkIn),
    },

    {
      key: 'checkOut',
      label: 'Check Out',
      render: (employee) =>
        formatTime(employee.checkOut),
    },

    {
      key: 'hours',
      label: 'Hours',
      render: (employee) =>
        formatTime(employee.hours),
    },

    {
      key: 'actions',
      label: 'Actions',
      render: (employee) => (
        <div className="attendance-actions">

          <select
            value={employee.status}
            onChange={(event) =>
              handleStatusChange(
                employee._id,
                event.target.value,
              )
            }
          >
            {statusOptions
              .filter(
                (item) => item !== 'All',
              )
              .map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
          </select>

          <button
            type="button"
            onClick={() =>
              handleDelete(
                employee._id,
              )
            }
          >
            Delete
          </button>

        </div>
      ),
    },
  ]

  // ==========================================
  // OPEN MODAL
  // ==========================================

  const openAttendanceModal = () => {
    setForm({
      employeeId: '',
      employeeName: '',
      department: '',
      date: formatDateForInput(
        selectedDate,
      ),
      status: 'Present',
      checkIn: '',
      checkOut: '',
      hours: '',
    })

    setShowModal(true)
  }

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleFormChange = (event) => {
    const { name, value } =
      event.target

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  // ==========================================
  // CREATE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      const created =
        await createAttendance(form)

      setAttendance((previous) => [
        created,
        ...previous,
      ])

      setShowModal(false)
    } catch (error) {
      setError(
        error.message ||
          'Failed to mark attendance',
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // UPDATE
  // ==========================================

  const handleStatusChange = async (
    id,
    status,
  ) => {
    try {
      setError('')

      const updated =
        await updateAttendance(id, {
          status,
        })

      setAttendance((previous) =>
        previous.map((record) =>
          record._id === id
            ? updated
            : record,
        ),
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to update attendance',
      )
    }
  }

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this attendance record?',
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteAttendance(id)

      setAttendance((previous) =>
        previous.filter(
          (record) =>
            record._id !== id,
        ),
      )
    } catch (error) {
      setError(
        error.message ||
          'Failed to delete attendance',
      )
    }
  }

  // ==========================================
  // STATUS VARIANT
  // ==========================================

  function getStatusVariant(status) {
    if (status === 'Present') {
      return 'success'
    }

    if (status === 'Late') {
      return 'warning'
    }

    if (status === 'Absent') {
      return 'danger'
    }

    return 'neutral'
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="attendance-page">

        <div className="attendance-header">

          <div>
            <span className="module-eyebrow">
              WORKFORCE
            </span>

            <h1>
              Attendance
            </h1>

            <p>
              Monitor employee attendance,
              working hours and daily activity.
            </p>
          </div>

        </div>

        <div className="content-section">
          <p>
            Loading attendance...
          </p>
        </div>

      </div>
    )
  }

  return (
    <div className="attendance-page">

      {/* HEADER */}

      <div className="attendance-header">

        <div>

          <span className="module-eyebrow">
            WORKFORCE
          </span>

          <h1>
            Attendance
          </h1>

          <p>
            Monitor employee attendance,
            working hours and daily activity.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={
            openAttendanceModal
          }
        >
          + Mark Attendance
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="content-section">
          <p>{error}</p>
        </div>
      )}


      {/* DATE BAR */}

      <div className="attendance-date-bar">

        <div>

          <span className="attendance-date-label">
            Selected Date
          </span>

          <strong>
            {formatDisplayDate(
              selectedDate,
            )}
          </strong>

        </div>

        <div className="attendance-date-actions">

          <button
            onClick={() =>
              setSelectedDate(
                new Date(
                  selectedDate.getTime() -
                    86400000,
                ),
              )
            }
          >
            ←
          </button>

          <button
            onClick={() =>
              setSelectedDate(
                new Date(),
              )
            }
          >
            Today
          </button>

          <button
            onClick={() =>
              setSelectedDate(
                new Date(
                  selectedDate.getTime() +
                    86400000,
                ),
              )
            }
          >
            →
          </button>

        </div>

      </div>


      {/* SUMMARY */}

      <div className="attendance-summary">

        <div className="attendance-summary-card">
          <span>Present</span>
          <strong>{summary.present}</strong>
          <small>Selected date</small>
        </div>

        <div className="attendance-summary-card">
          <span>Late</span>
          <strong>{summary.late}</strong>
          <small>Selected date</small>
        </div>

        <div className="attendance-summary-card">
          <span>Absent</span>
          <strong>{summary.absent}</strong>
          <small>Selected date</small>
        </div>

        <div className="attendance-summary-card">
          <span>Work From Home</span>
          <strong>{summary.wfh}</strong>
          <small>Selected date</small>
        </div>

      </div>


      {/* FILTERS */}

      <div className="attendance-filters">

        <div>

          <label>
            Status
          </label>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value,
              )
            }
          >

            {statusOptions.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}

          </select>

        </div>


        <div>

          <label>
            Department
          </label>

          <select
            value={department}
            onChange={(event) =>
              setDepartment(
                event.target.value,
              )
            }
          >

            {departmentOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}

          </select>

        </div>

      </div>


      {/* TABLE */}

      <div className="attendance-table-section">

        <div className="attendance-section-header">

          <div>

            <h2>
              Daily Attendance
            </h2>

            <p>
              Employee attendance records
              for the selected date.
            </p>

          </div>

          <span>
            {filteredEmployees.length}{' '}
            records
          </span>

        </div>

        <DataTable
          columns={columns}
          data={filteredEmployees}
          emptyMessage="No attendance records found for the selected date and filters."
        />

      </div>


      {/* MODAL */}

      {showModal && (

        <div
          className="attendance-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="attendance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="attendance-modal-header">

              <div>

                <span className="module-eyebrow">
                  WORKFORCE
                </span>

                <h2>
                  Mark Attendance
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="attendance-form"
            >

              <div className="attendance-form-grid">

                <div>
                  <label>
                    Employee ID
                  </label>

                  <input
                    name="employeeId"
                    value={
                      form.employeeId
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="EMP001"
                    required
                  />
                </div>


                <div>
                  <label>
                    Employee Name
                  </label>

                  <input
                    name="employeeName"
                    value={
                      form.employeeName
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Arjun Kumar"
                    required
                  />
                </div>


                <div>
                  <label>
                    Department
                  </label>

                  <input
                    name="department"
                    value={
                      form.department
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Engineering"
                    required
                  />
                </div>


                <div>
                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={
                      form.date
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />
                </div>


                <div>
                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleFormChange
                    }
                  >

                    <option value="Present">
                      Present
                    </option>

                    <option value="Late">
                      Late
                    </option>

                    <option value="Absent">
                      Absent
                    </option>

                    <option value="WFH">
                      WFH
                    </option>

                  </select>
                </div>


                <div>
                  <label>
                    Check In
                  </label>

                  <input
                    name="checkIn"
                    value={
                      form.checkIn
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="08:54 AM"
                  />
                </div>


                <div>
                  <label>
                    Check Out
                  </label>

                  <input
                    name="checkOut"
                    value={
                      form.checkOut
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="05:42 PM"
                  />
                </div>


                <div>
                  <label>
                    Hours
                  </label>

                  <input
                    name="hours"
                    value={
                      form.hours
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="8h 48m"
                  />
                </div>

              </div>


              <div className="attendance-form-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Mark Attendance'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Attendance