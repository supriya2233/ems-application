import { useState } from 'react'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'

const attendanceEmployees = [
  {
    id: 1,
    name: 'Arjun Kumar',
    department: 'Engineering',
    status: 'Present',
    checkIn: '08:54 AM',
    checkOut: '05:42 PM',
    hours: '8h 48m',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    department: 'Design',
    status: 'Present',
    checkIn: '09:07 AM',
    checkOut: '—',
    hours: '7h 21m',
  },
  {
    id: 3,
    name: 'Rahul Verma',
    department: 'Management',
    status: 'Late',
    checkIn: '09:42 AM',
    checkOut: '—',
    hours: '6h 46m',
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    department: 'Human Resources',
    status: 'Present',
    checkIn: '08:48 AM',
    checkOut: '05:31 PM',
    hours: '8h 43m',
  },
  {
    id: 5,
    name: 'Karan Mehta',
    department: 'Marketing',
    status: 'Absent',
    checkIn: '—',
    checkOut: '—',
    hours: '—',
  },
  {
    id: 6,
    name: 'Ananya Rao',
    department: 'Finance',
    status: 'WFH',
    checkIn: '09:02 AM',
    checkOut: '—',
    hours: '7h 18m',
  },
]

const weeklyData = [
  { day: 'Mon', present: 21, absent: 2, late: 1 },
  { day: 'Tue', present: 20, absent: 3, late: 1 },
  { day: 'Wed', present: 22, absent: 1, late: 1 },
  { day: 'Thu', present: 19, absent: 3, late: 2 },
  { day: 'Fri', present: 21, absent: 2, late: 1 },
]

function Attendance() {
  const [filter, setFilter] = useState('All')
  const [department, setDepartment] = useState('All Departments')

  const filteredEmployees = attendanceEmployees.filter((employee) => {
    const statusMatch =
      filter === 'All' || employee.status === filter

    const departmentMatch =
      department === 'All Departments' ||
      employee.department === department

    return statusMatch && departmentMatch
  })

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
            Monitor employee attendance, working hours and daily activity.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            alert(
              'Attendance marking will be connected to the backend later.',
            )
          }
        >
          + Mark Attendance
        </button>

      </div>


      {/* DATE BAR */}

      <div className="attendance-date-bar">

        <div>
          <span className="attendance-date-label">
            Today
          </span>

          <strong>
            11 August 2026
          </strong>
        </div>

        <div className="attendance-date-actions">

          <button>
            ←
          </button>

          <button className="today-button">
            Today
          </button>

          <button>
            →
          </button>

        </div>

      </div>


      {/* SUMMARY */}

      <section className="attendance-summary">

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon present">
            ✓
          </div>

          <span>
            Present
          </span>

          <strong>
            21
          </strong>

          <small>
            87.5% of employees
          </small>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon late">
            ◷
          </div>

          <span>
            Late
          </span>

          <strong>
            2
          </strong>

          <small>
            Need attention
          </small>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon absent">
            —
          </div>

          <span>
            Absent
          </span>

          <strong>
            1
          </strong>

          <small>
            4.2% of employees
          </small>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon wfh">
            ◉
          </div>

          <span>
            Work From Home
          </span>

          <strong>
            4
          </strong>

          <small>
            Remote employees
          </small>

        </div>

      </section>


      {/* LOWER DASHBOARD */}

      <div className="attendance-dashboard-grid">

        {/* WEEKLY OVERVIEW */}

        <section className="content-card attendance-weekly-card">

          <div className="section-heading">

            <div>
              <h2>
                Weekly Attendance
              </h2>

              <p>
                Attendance distribution for this week
              </p>
            </div>

            <select defaultValue="This Week">
              <option>
                This Week
              </option>

              <option>
                Last Week
              </option>

              <option>
                This Month
              </option>
            </select>

          </div>


          <div className="attendance-chart">

            {weeklyData.map((day) => {

              const total =
                day.present +
                day.absent +
                day.late

              const height =
                Math.max(
                  (day.present / 24) * 100,
                  10,
                )

              return (
                <div
                  className="attendance-chart-column"
                  key={day.day}
                >

                  <div className="attendance-chart-value">
                    {total}
                  </div>

                  <div className="attendance-bar-area">

                    <div
                      className="attendance-bar"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                  </div>

                  <span>
                    {day.day}
                  </span>

                </div>
              )
            })}

          </div>


          <div className="attendance-chart-legend">

            <span>
              <i className="legend-present" />
              Present
            </span>

            <span>
              <i className="legend-late" />
              Late
            </span>

            <span>
              <i className="legend-absent" />
              Absent
            </span>

          </div>

        </section>


        {/* ATTENDANCE RATE */}

        <section className="content-card attendance-rate-card">

          <div className="section-heading">

            <div>
              <h2>
                Attendance Rate
              </h2>

              <p>
                Organization-wide attendance
              </p>
            </div>

          </div>


          <div className="attendance-circle">

            <div>
              <strong>
                87.5%
              </strong>

              <span>
                Attendance
              </span>
            </div>

          </div>


          <div className="attendance-rate-details">

            <div>
              <span>
                Present
              </span>

              <strong>
                21
              </strong>
            </div>

            <div>
              <span>
                Absent
              </span>

              <strong>
                1
              </strong>
            </div>

            <div>
              <span>
                Late
              </span>

              <strong>
                2
              </strong>
            </div>

          </div>

        </section>

      </div>


      {/* EMPLOYEE ATTENDANCE */}

      <section className="content-card attendance-table-card">

        <div className="section-heading">

          <div>
            <h2>
              Today's Attendance
            </h2>

            <p>
              Employee attendance records for today
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              alert(
                'Attendance report export will be connected later.',
              )
            }
          >
            Export Report
          </button>

        </div>


        {/* FILTERS */}

        <div className="attendance-filters">

          <div className="attendance-filter-tabs">

            {[
              'All',
              'Present',
              'Late',
              'Absent',
              'WFH',
            ].map((item) => (

              <button
                key={item}
                className={
                  filter === item
                    ? 'attendance-filter-active'
                    : ''
                }
                onClick={() => setFilter(item)}
              >
                {item}
              </button>

            ))}

          </div>


          <select
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >

            <option>
              All Departments
            </option>

            <option>
              Engineering
            </option>

            <option>
              Design
            </option>

            <option>
              Management
            </option>

            <option>
              Human Resources
            </option>

            <option>
              Marketing
            </option>

            <option>
              Finance
            </option>

          </select>

        </div>


        {/* TABLE */}

        <DataTable
  columns={attendanceColumns}
  data={filteredEmployees}
  emptyMessage="No attendance records found."
/>

      </section>

    </div>
  )
}
const attendanceColumns = [
  {
    key: 'name',
    label: 'Employee',
  },
  {
    key: 'department',
    label: 'Department',
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: 'checkIn',
    label: 'Check In',
  },
  {
    key: 'checkOut',
    label: 'Check Out',
  },
  {
    key: 'hours',
    label: 'Working Hours',
  },
]
export default Attendance