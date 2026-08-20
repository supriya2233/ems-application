import { useEffect, useMemo, useState } from 'react'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
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
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [deletingEmployee, setDeletingEmployee] = useState(null)

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    employmentType: 'Full-time',
  })

  /*
   * LOAD EMPLOYEES
   */
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

  /*
   * DEPARTMENTS
   */
  const departments = useMemo(() => {
    return [
      'All',
      ...new Set(
        employees
          .map((employee) => employee.department)
          .filter(Boolean),
      ),
    ]
  }, [employees])

  /*
   * FILTER EMPLOYEES
   */
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchValue = search.toLowerCase()

      const matchesSearch =
        employee.name?.toLowerCase().includes(searchValue) ||
        employee.role?.toLowerCase().includes(searchValue) ||
        employee.department?.toLowerCase().includes(searchValue) ||
        employee.email?.toLowerCase().includes(searchValue)

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

  /*
   * INPUT CHANGE
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target

    setNewEmployee((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  /*
   * ADD EMPLOYEE
   */
  const handleAddEmployee = async (event) => {
    event.preventDefault()

    try {
      const employee = {
        employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
        ...newEmployee,
        initials: newEmployee.name
          .trim()
          .split(/\s+/)
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

  /*
   * EDIT EMPLOYEE
   */
  const handleEditEmployee = async (event) => {
    event.preventDefault()

    if (!editingEmployee) return

    try {
      const updatedEmployee = await updateEmployee(
        editingEmployee._id,
        editingEmployee,
      )

      setEmployees((previous) =>
        previous.map((employee) =>
          employee._id === updatedEmployee._id
            ? updatedEmployee
            : employee,
        ),
      )

      setEditingEmployee(null)
    } catch (error) {
      console.error('Failed to update employee:', error)
      alert(error.message)
    }
  }

  /*
   * DELETE EMPLOYEE
   */
  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return

    try {
      await deleteEmployee(deletingEmployee._id)

      setEmployees((previous) =>
        previous.filter(
          (employee) =>
            employee._id !== deletingEmployee._id,
        ),
      )

      setDeletingEmployee(null)
    } catch (error) {
      console.error('Failed to delete employee:', error)
      alert(error.message)
    }
  }

  /*
   * RESET ADD FORM
   */
  const closeAddModal = () => {
    setShowModal(false)

    setNewEmployee({
      name: '',
      role: '',
      department: '',
      email: '',
      phone: '',
      employmentType: 'Full-time',
    })
  }

  return (
    <section className="employees-page">

      {/* Loading */}
      {loading && (
        <div className="empty-state">
          <strong>Loading employees...</strong>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="empty-state">
          <strong>{error}</strong>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            PEOPLE MANAGEMENT
          </p>

          <h1>Employees</h1>

          <p>
            Manage employees, teams, roles and
            organizational structure.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          + Add Employee
        </button>

      </div>

      {/* TABS */}
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
            {
              employees.filter(
                (employee) =>
                  employee.status === 'Active',
              ).length
            }
          </span>
        </button>

        <button
          className={activeTab === 'leave' ? 'tab-active' : ''}
          onClick={() => setActiveTab('leave')}
        >
          On Leave
          <span>
            {
              employees.filter(
                (employee) =>
                  employee.status === 'On Leave',
              ).length
            }
          </span>
        </button>

        <button
          className={activeTab === 'org' ? 'tab-active' : ''}
          onClick={() => setActiveTab('org')}
        >
          Org Chart
        </button>

      </div>

      {/* ORG CHART */}
      {activeTab === 'org' ? (

        <div className="org-chart">

          <div className="org-node org-root">
            <strong>Administrator</strong>
            <span>System Manager</span>
          </div>

          <div className="org-line" />

          <div className="org-grid">

            {[
              'Engineering',
              'Design',
              'Human Resources',
            ].map((department) => {

              const departmentEmployees =
                employees.filter(
                  (employee) =>
                    employee.department === department,
                )

              return (
                <div
                  className="org-column"
                  key={department}
                >

                  <div className="org-node">
                    <strong>{department}</strong>
                    <span>
                      {departmentEmployees.length}{' '}
                      employee
                      {departmentEmployees.length !== 1
                        ? 's'
                        : ''}
                    </span>
                  </div>

                  <div className="org-children">

                    {departmentEmployees.map(
                      (employee) => (
                        <div
                          className="org-node small"
                          key={employee._id}
                        >
                          <strong>
                            {employee.name}
                          </strong>

                          <span>
                            {employee.role}
                          </span>
                        </div>
                      ),
                    )}

                  </div>

                </div>
              )
            })}

          </div>

        </div>

      ) : (

        <>
          {/* FILTERS */}
          <div className="employees-toolbar">

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search employees..."
            />

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value,
                )
              }
            >
              {departments.map((department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department === 'All'
                    ? 'All departments'
                    : department}
                </option>
              ))}
            </select>

            <div className="view-toggle">

              <button
                className={
                  viewMode === 'list'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setViewMode('list')
                }
              >
                List
              </button>

              <button
                className={
                  viewMode === 'card'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setViewMode('card')
                }
              >
                Cards
              </button>

            </div>

          </div>

          {/* LIST VIEW */}
          {viewMode === 'list' ? (

            <div className="employee-table-card">

              <div className="employee-table">

                <div className="employee-table-header">
                  <span>Employee</span>
                  <span>Role</span>
                  <span>Department</span>
                  <span>Employment</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {filteredEmployees.map(
                  (employee) => (

                    <div
                      className="employee-table-row"
                      key={employee._id}
                    >

                      <div className="employee-name-cell">

                        <div className="employee-avatar">
                          {employee.initials}
                        </div>

                        <div>
                          <strong>
                            {employee.name}
                          </strong>

                          <span>
                            {employee.email}
                          </span>
                        </div>

                      </div>

                      <span>
                        {employee.role}
                      </span>

                      <span>
                        {employee.department}
                      </span>

                      <span>
                        {employee.employmentType}
                      </span>

                      <Badge>
                        {employee.status}
                      </Badge>

                      <div className="employee-actions">

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setEditingEmployee({
                              ...employee,
                            })
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            setDeletingEmployee(
                              employee,
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  ),
                )}

              </div>

              {filteredEmployees.length === 0 && (
                <div className="empty-state">
                  <strong>
                    No employees found
                  </strong>

                  <p>
                    Try changing your search or
                    filter.
                  </p>
                </div>
              )}

            </div>

          ) : (

            /* CARD VIEW */
            <div className="employee-card-grid">

              {filteredEmployees.map(
                (employee) => (

                  <div
                    className="employee-card"
                    key={employee._id}
                  >

                    <div className="employee-card-top">

                      <div className="employee-avatar large">
                        {employee.initials}
                      </div>

                      <Badge>
                        {employee.status}
                      </Badge>

                    </div>

                    <h3>
                      {employee.name}
                    </h3>

                    <p>
                      {employee.role}
                    </p>

                    <div className="employee-card-details">
                      <span>
                        {employee.department}
                      </span>

                      <span>
                        {employee.email}
                      </span>

                      <span>
                        {employee.employmentType}
                      </span>
                    </div>

                    <div className="employee-actions">

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setEditingEmployee({
                            ...employee,
                          })
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          setDeletingEmployee(
                            employee,
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                ),
              )}

            </div>

          )}
        </>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showModal && (

        <div
          className="modal-backdrop"
          onClick={closeAddModal}
        >

          <div
            className="employee-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <p className="page-eyebrow">
                  EMPLOYEE MANAGEMENT
                </p>

                <h2>Add Employee</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAddModal}
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
                    value={
                      newEmployee.employmentType
                    }
                    onChange={handleInputChange}
                  >
                    <option>
                      Full-time
                    </option>

                    <option>
                      Part-time
                    </option>

                    <option>
                      Contract
                    </option>

                    <option>
                      Intern
                    </option>
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
                  onClick={closeAddModal}
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

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setEditingEmployee(null)
          }
        >

          <div
            className="employee-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <p className="page-eyebrow">
                  EMPLOYEE MANAGEMENT
                </p>

                <h2>Edit Employee</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setEditingEmployee(null)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={handleEditEmployee}>

              <div className="form-grid">

                <label>
                  Full name

                  <input
                    value={editingEmployee.name}
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Role

                  <input
                    value={editingEmployee.role}
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        role: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Department

                  <input
                    value={
                      editingEmployee.department
                    }
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        department:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Employment type

                  <select
                    value={
                      editingEmployee.employmentType
                    }
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        employmentType:
                          event.target.value,
                      })
                    }
                  >
                    <option>
                      Full-time
                    </option>

                    <option>
                      Part-time
                    </option>

                    <option>
                      Contract
                    </option>

                    <option>
                      Intern
                    </option>
                  </select>
                </label>

                <label>
                  Email

                  <input
                    type="email"
                    value={editingEmployee.email}
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Phone

                  <input
                    value={editingEmployee.phone || ''}
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        phone: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Status

                  <select
                    value={
                      editingEmployee.status
                    }
                    onChange={(event) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        status: event.target.value,
                      })
                    }
                  >
                    <option>
                      Active
                    </option>

                    <option>
                      On Leave
                    </option>

                    <option>
                      Inactive
                    </option>
                  </select>
                </label>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditingEmployee(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingEmployee && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setDeletingEmployee(null)
          }
        >

          <div
            className="employee-modal delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <p className="page-eyebrow">
                  EMPLOYEE MANAGEMENT
                </p>

                <h2>Delete Employee</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setDeletingEmployee(null)
                }
              >
                ×
              </button>

            </div>

            <p>
              Are you sure you want to delete{' '}
              <strong>
                {deletingEmployee.name}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDeletingEmployee(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={handleDeleteEmployee}
              >
                Delete Employee
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  )
}

export default Employees