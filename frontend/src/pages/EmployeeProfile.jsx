import { useNavigate, useParams } from 'react-router-dom'
import { employees } from '../data/employees'

function EmployeeProfile() {
  const { employeeId } = useParams()
  const navigate = useNavigate()

  const employee = employees.find(
    (item) => item.id === employeeId
  )

  if (!employee) {
    return (
      <div className="module-page">
        <div className="profile-not-found">
          <div className="profile-not-found-icon">?</div>

          <h1>Employee not found</h1>

          <p>
            The employee you're looking for doesn't exist in the
            current employee records.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate('/employees')}
          >
            Back to Employees
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (date) => {
    if (!date) return '—'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="module-page employee-profile-page">

      {/* Back */}

      <button
        className="back-button"
        onClick={() => navigate('/employees')}
      >
        ← Back to Employees
      </button>


      {/* Profile Header */}

      <section className="profile-header-card">

        <div className="profile-main">

          <div className="profile-avatar">
            {employee.initials}
          </div>

          <div className="profile-heading">

            <div className="profile-name-row">

              <h1>{employee.name}</h1>

              <span
                className={`profile-status ${
                  employee.status
                    .toLowerCase()
                    .replaceAll(' ', '-')
                }`}
              >
                {employee.status}
              </span>

            </div>

            <p className="profile-role">
              {employee.role}
            </p>

            <p className="profile-department">
              {employee.department}
            </p>

          </div>

        </div>

        <div className="profile-actions">

          <button className="secondary-button">
            Edit Profile
          </button>

          <button className="primary-button">
            More Actions
          </button>

        </div>

      </section>


      {/* Quick information */}

      <section className="profile-summary-grid">

        <div className="profile-summary-card">
          <span>Employee ID</span>
          <strong>{employee.id}</strong>
        </div>

        <div className="profile-summary-card">
          <span>Department</span>
          <strong>{employee.department}</strong>
        </div>

        <div className="profile-summary-card">
          <span>Employment Type</span>
          <strong>{employee.employmentType}</strong>
        </div>

        <div className="profile-summary-card">
          <span>Manager</span>
          <strong>{employee.manager}</strong>
        </div>

      </section>


      {/* Main content */}

      <div className="profile-content-grid">

        {/* Personal information */}

        <section className="content-card profile-section">

          <div className="profile-section-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Basic contact information.</p>
            </div>
          </div>

          <div className="profile-details-grid">

            <div className="profile-detail">
              <span>Email</span>
              <strong>{employee.email}</strong>
            </div>

            <div className="profile-detail">
              <span>Phone</span>
              <strong>{employee.phone}</strong>
            </div>

          </div>

        </section>


        {/* Employment information */}

        <section className="content-card profile-section">

          <div className="profile-section-heading">
            <div>
              <h2>Employment Information</h2>
              <p>Current employment details.</p>
            </div>
          </div>

          <div className="profile-details-grid">

            <div className="profile-detail">
              <span>Role</span>
              <strong>{employee.role}</strong>
            </div>

            <div className="profile-detail">
              <span>Department</span>
              <strong>{employee.department}</strong>
            </div>

            <div className="profile-detail">
              <span>Joining Date</span>
              <strong>
                {formatDate(employee.joiningDate)}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Employment Type</span>
              <strong>{employee.employmentType}</strong>
            </div>

            <div className="profile-detail">
              <span>Reporting Manager</span>
              <strong>{employee.manager}</strong>
            </div>

            <div className="profile-detail">
              <span>Current Status</span>
              <strong>{employee.status}</strong>
            </div>

          </div>

        </section>


        {/* Leave information */}

        {employee.status === 'On Leave' && (
          <section className="content-card profile-section leave-profile-card">

            <div className="profile-section-heading">

              <div>
                <h2>Current Leave</h2>
                <p>Current employee leave information.</p>
              </div>

              <span className="profile-leave-badge">
                {employee.leaveType}
              </span>

            </div>

            <div className="profile-details-grid">

              <div className="profile-detail">
                <span>Leave Type</span>
                <strong>{employee.leaveType}</strong>
              </div>

              <div className="profile-detail">
                <span>From</span>
                <strong>
                  {formatDate(employee.leaveFrom)}
                </strong>
              </div>

              <div className="profile-detail">
                <span>To</span>
                <strong>
                  {formatDate(employee.leaveTo)}
                </strong>
              </div>

            </div>

          </section>
        )}


        {/* Activity placeholder */}

        <section className="content-card profile-section">

          <div className="profile-section-heading">

            <div>
              <h2>Employee Activity</h2>
              <p>
                Attendance, leave, performance and task activity
                will appear here.
              </p>
            </div>

          </div>

          <div className="profile-coming-soon">

            <div className="profile-coming-icon">
              +
            </div>

            <div>
              <strong>Employee activity</strong>

              <p>
                This section is prepared for backend-powered
                employee activity and history.
              </p>
            </div>

          </div>

        </section>

      </div>

    </div>
  )
}

export default EmployeeProfile