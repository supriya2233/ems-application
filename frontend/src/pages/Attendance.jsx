import { useEffect, useMemo, useState } from 'react'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from '../services/attendanceService'
import { getEmployees } from '../services/employeeService'

const statusOptions = [
  'All',
  'Present',
  'Late',
  'Absent',
  'WFH',
]

function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])

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
  // LOAD ATTENDANCE + EMPLOYEES
  // ==========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          attendanceData,
          employeeData,
        ] = await Promise.all([
          getAttendance(),
          getEmployees(),
        ])

        setAttendance(attendanceData)
        setEmployees(employeeData)
      } catch (error) {
        console.error(
          'Failed to load attendance data:',
          error,
        )

        setError(
          error.message ||
            'Failed to load attendance',
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
    }, [
      attendance,
      selectedDateString,
    ])

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
  // DEPARTMENTS
  // ==========================================

  const departmentOptions = useMemo(() => {
    const departments =
      employees
        .map(
          (employee) =>
            employee.department,
        )
        .filter(Boolean)

    return [
      'All Departments',
      ...new Set(departments),
    ]
  }, [employees])

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
  // EMPLOYEE CHANGE
  // ==========================================

  const handleEmployeeChange = (event) => {
    const employeeId =
      event.target.value

    const selectedEmployee =
      employees.find(
        (employee) =>
          employee.employeeId ===
          employeeId,
      )

    if (!selectedEmployee) {
      setForm((previous) => ({
        ...previous,
        employeeId: '',
        employeeName: '',
        department: '',
      }))

      return
    }

    setForm((previous) => ({
      ...previous,
      employeeId:
        selectedEmployee.employeeId,
      employeeName:
        selectedEmployee.name,
      department:
        selectedEmployee.department,
    }))
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

    if (!form.employeeId) {
      setError(
        'Please select an employee.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      const created =
        await createAttendance({
          employeeId:
            form.employeeId,

          employeeName:
            form.employeeName,

          department:
            form.department,

          date: form.date,

          status: form.status,

          checkIn: form.checkIn,

          checkOut: form.checkOut,

          hours: form.hours,
        })

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
  // UPDATE STATUS
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
    const confirmed =
      window.confirm(
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

      {/* ======================================
          HEADER
      ====================================== */}

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


      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="content-section">

          <p>{error}</p>

        </div>
      )}


      {/* ======================================
          DATE BAR
      ====================================== */}

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
            type="button"
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
            type="button"
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

          <button
            type="button"
            onClick={() =>
              setSelectedDate(
                new Date(),
              )
            }
          >
            Today
          </button>

        </div>

      </div>


      {/* ======================================
          SUMMARY
      ====================================== */}

      <div className="stats-grid">

        <div className="info-card">

          <span>
            Present
          </span>

          <strong>
            {summary.present}
          </strong>

          <small>
            Selected date
          </small>

        </div>


        <div className="info-card">

          <span>
            Late
          </span>

          <strong>
            {summary.late}
          </strong>

          <small>
            Selected date
          </small>

        </div>


        <div className="info-card">

          <span>
            Absent
          </span>

          <strong>
            {summary.absent}
          </strong>

          <small>
            Selected date
          </small>

        </div>


        <div className="info-card">

          <span>
            Work From Home
          </span>

          <strong>
            {summary.wfh}
          </strong>

          <small>
            Selected date
          </small>

        </div>

      </div>


      {/* ======================================
          ATTENDANCE SECTION
      ====================================== */}

      <div className="content-section">

        <div className="section-header">

          <div>

            <h2>
              Daily Attendance
            </h2>

            <p>
              Employee attendance records
              for the selected date.
            </p>

          </div>

        </div>


        {/* FILTERS */}

        <div className="filters">

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
                  {status === 'All'
                    ? 'All Statuses'
                    : status}
                </option>
              ),
            )}

          </select>


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


        {/* TABLE */}

        <DataTable
          columns={columns}
          data={filteredEmployees}
          emptyMessage={
            'No attendance records found for this date.'
          }
        />

      </div>


      {/* ======================================
          MARK ATTENDANCE MODAL
      ====================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

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
              className="leave-form"
            >

              <div className="form-grid">

                {/* EMPLOYEE */}

                <div>

                  <label>
                    Employee
                  </label>

                  <select
                    value={
                      form.employeeId
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    required
                  >

                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={
                            employee._id
                          }
                          value={
                            employee.employeeId
                          }
                        >
                          {employee.name} (
                          {
                            employee.employeeId
                          }
                          )
                        </option>
                      ),
                    )}

                  </select>

                </div>


                {/* EMPLOYEE ID */}

                <div>

                  <label>
                    Employee ID
                  </label>

                  <input
                    value={
                      form.employeeId
                    }
                    readOnly
                    placeholder="Select employee"
                  />

                </div>


                {/* DEPARTMENT */}

                <div>

                  <label>
                    Department
                  </label>

                  <input
                    value={
                      form.department
                    }
                    readOnly
                    placeholder="Select employee"
                  />

                </div>


                {/* DATE */}

                <div>

                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>


                {/* STATUS */}

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

                    {statusOptions
                      .filter(
                        (status) =>
                          status !==
                          'All',
                      )
                      .map(
                        (status) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {status}
                          </option>
                        ),
                      )}

                  </select>

                </div>


                {/* CHECK IN */}

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


                {/* CHECK OUT */}

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


                {/* HOURS */}

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


              {/* ACTIONS */}

              <div className="form-actions">

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
                  disabled={
                    saving ||
                    employees.length ===
                      0
                  }
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