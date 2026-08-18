import { useEffect, useMemo, useState } from 'react'
import {
  getEmployees,
  createEmployee,
} from '../services/employeeService'
import Badge from '../components/common/Badge'
import SearchBar from '../components/common/SearchBar'

function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getEmployees()

      setEmployees(data)
    } catch (error) {
      console.error('Failed to load employees:', error)
      setError('Failed to load employees from the server.')
    } finally {
      setLoading(false)
    }
  }

  loadEmployees()
}, [])

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    employmentType: 'Full-time',
  })

  const departments = [
  'All',
  ...new Set(employees.map((employee) => employee.department)),
]

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.role.toLowerCase().includes(search.toLowerCase()) ||
        employee.department.toLowerCase().includes(search.toLowerCase())

      const matchesDepartment =
        departmentFilter === 'All' ||
        employee.department === departmentFilter

      if (activeTab === 'active') {
        return (
          matchesSearch &&
          matchesDepartment &&
          employee.status === 'Active'
        )
      }

      if (activeTab === 'leave') {
        return (
          matchesSearch &&
          matchesDepartment &&
          employee.status === 'On Leave'
        )
      }

      return matchesSearch && matchesDepartment
    })
  }, [employees, activeTab, search, departmentFilter])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setNewEmployee((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleAddEmployee = async (event) => {
  event.preventDefault()

  try {
    const employee = {
      employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      ...newEmployee,
      initials: newEmployee.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      manager: 'Administrator',
    }

    const createdEmployee = await createEmployee(employee)

    setEmployees((previous) => [
      createdEmployee,
      ...previous,
    ])

    setNewEmployee({
      name: '',
      role: '',
      department: '',
      email: '',
      phone: '',
      employmentType: 'Full-time',
    })

    setShowModal(false)
  } catch (error) {
    console.error('Failed to add employee:', error)
    alert(error.message)
  }
}

  return (
    <section className="employees-page">

      {loading && (
  <div className="empty-state">
    <strong>Loading employees...</strong>
  </div>
)}

{error && (
  <div className="empty-state">
    <strong>{error}</strong>
  </div>
)}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">PEOPLE MANAGEMENT</p>
          <h1>Employees</h1>
          <p>
            Manage employees, teams, roles and organizational structure.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          + Add Employee
        </button>
      </div>

      {/* Tabs */}
      <div className="employees-tabs">
        <button
          className={activeTab === 'all' ? 'tab-active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Employees
          <span>{employees.length}</span>
        </button>

        <button
          className={activeTab === 'active' ? 'tab-active' : ''}
          onClick={() => setActiveTab('active')}
        >
          Active
          <span>
            {employees.filter((employee) => employee.status === 'Active').length}
          </span>
        </button>

        <button
          className={activeTab === 'leave' ? 'tab-active' : ''}
          onClick={() => setActiveTab('leave')}
        >
          On Leave
          <span>
            {employees.filter((employee) => employee.status === 'On Leave').length}
          </span>
        </button>

        <button
          className={activeTab === 'org' ? 'tab-active' : ''}
          onClick={() => setActiveTab('org')}
        >
          Org Chart
        </button>
      </div>

      {/* Org Chart */}
      {activeTab === 'org' ? (
        <div className="org-chart">

          <div className="org-node org-root">
            <strong>Administrator</strong>
            <span>System Manager</span>
          </div>

          <div className="org-line" />

          <div className="org-grid">

            <div className="org-column">
              <div className="org-node">
                <strong>Engineering</strong>
                <span>2 employees</span>
              </div>

              <div className="org-children">
                {employees
                  .filter(
                    (employee) =>
                      employee.department === 'Engineering'
                  )
                  .map((employee) => (
                    <div className="org-node small" key={employee.id}>
                      <strong>{employee.name}</strong>
                      <span>{employee.role}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="org-column">
              <div className="org-node">
                <strong>Design</strong>
                <span>2 employees</span>
              </div>

              <div className="org-children">
                {employees
                  .filter(
                    (employee) =>
                      employee.department === 'Design'
                  )
                  .map((employee) => (
                    <div className="org-node small" key={employee.id}>
                      <strong>{employee.name}</strong>
                      <span>{employee.role}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="org-column">
              <div className="org-node">
                <strong>Human Resources</strong>
                <span>2 employees</span>
              </div>

              <div className="org-children">
                {employees
                  .filter(
                    (employee) =>
                      employee.department === 'Human Resources'
                  )
                  .map((employee) => (
                    <div className="org-node small" key={employee.id}>
                      <strong>{employee.name}</strong>
                      <span>{employee.role}</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="employees-toolbar">

            <SearchBar
  value={search}
  onChange={setSearch}
  placeholder="Search employees..."
/>

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(event.target.value)
              }
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department === 'All'
                    ? 'All departments'
                    : department}
                </option>
              ))}
            </select>

            <div className="view-toggle">
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                List
              </button>

              <button
                className={viewMode === 'card' ? 'active' : ''}
                onClick={() => setViewMode('card')}
              >
                Cards
              </button>
            </div>

          </div>

          {/* Employee List */}
          {viewMode === 'list' ? (
            <div className="employee-table-card">

              <div className="employee-table">

                <div className="employee-table-header">
                  <span>Employee</span>
                  <span>Role</span>
                  <span>Department</span>
                  <span>Employment</span>
                  <span>Status</span>
                </div>

                {filteredEmployees.map((employee) => (
                  <div
                    className="employee-table-row"
                    key={employee.id}
                  >
                    <div className="employee-name-cell">
                      <div className="employee-avatar">
                        {employee.initials}
                      </div>

                      <div>
                        <strong>{employee.name}</strong>
                        <span>{employee.email}</span>
                      </div>
                    </div>

                    <span>{employee.role}</span>

                    <span>{employee.department}</span>

                    <span>{employee.employmentType}</span>

                    <Badge>
  {employee.status}
</Badge>
                  </div>
                ))}

              </div>

              {filteredEmployees.length === 0 && (
                <div className="empty-state">
                  <strong>No employees found</strong>
                  <p>
                    Try changing your search or filter.
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="employee-card-grid">

              {filteredEmployees.map((employee) => (
                <div
                  className="employee-card"
                  key={employee.id}
                >
                  <div className="employee-card-top">
                    <div className="employee-avatar large">
                      {employee.initials}
                    </div>

                    <Badge>
  {employee.status}
</Badge>
                  </div>

                  <h3>{employee.name}</h3>
                  <p>{employee.role}</p>

                  <div className="employee-card-details">
                    <span>{employee.department}</span>
                    <span>{employee.email}</span>
                  </div>
                </div>
              ))}

            </div>
          )}
        </>
      )}

      {/* Add Employee Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
        >
          <div
            className="employee-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">EMPLOYEE MANAGEMENT</p>
                <h2>Add Employee</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddEmployee}>

              <div className="form-grid">

                <label>
                  Full name
                  <input
                    name="name"
                    value={newEmployee.name}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Role
                  <input
                    name="role"
                    value={newEmployee.role}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Department
                  <input
                    name="department"
                    value={newEmployee.department}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Employment type
                  <select
                    name="employmentType"
                    value={newEmployee.employmentType}
                    onChange={handleInputChange}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Intern</option>
                  </select>
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    name="phone"
                    value={newEmployee.phone}
                    onChange={handleInputChange}
                    required
                  />
                </label>

              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Add Employee
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default Employees