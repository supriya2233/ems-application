import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Network, Plus, Users } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import DataTable from '../components/common/DataTable'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getDepartments } from '../services/departmentService'
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '../services/employeeService'
import { getAvatarColor, getInitials } from '../utils/avatar'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern']
const EMPLOYEE_STATUSES = ['Active', 'Onboarding', 'On Leave', 'Inactive']

// Status filter chips: [value, label]. "All" first.
const STATUS_FILTERS = [
  ['all', 'All'],
  ['Active', 'Active'],
  ['On Leave', 'On leave'],
  ['Onboarding', 'Onboarding'],
  ['Inactive', 'Inactive'],
]

const VIEWS = [
  ['list', 'List', List],
  ['card', 'Cards', LayoutGrid],
  ['org', 'Org chart', Network],
]

const VIEW_KEY = 'ems.employees.view'

const emptyEmployee = {
  name: '',
  role: '',
  department: '',
  email: '',
  phone: '',
  employmentType: 'Full-time',
}

const initialsOf = (employee) => employee.initials || getInitials(employee.name)

function Avatar({ employee, size = 'md' }) {
  return (
    <span
      className={`person-avatar person-avatar-${size}`}
      style={{ background: getAvatarColor(employee.name) }}
      aria-hidden="true"
    >
      {initialsOf(employee)}
    </span>
  )
}

function Employees() {
  const toast = useToast()
  const confirm = useConfirm()

  const [employees, setEmployees] = useState([])
  const [departmentNames, setDepartmentNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('all')
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'list')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All')

  // form: null (closed) or { mode: 'add' | 'edit', values }
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  // Another tab adding or editing someone reloads the list.
  const refreshKey = useLiveRefresh(['employees', 'departments'])

  useEffect(() => {
    let ignore = false

    Promise.all([getEmployees(), getDepartments().catch(() => [])])
      .then(([employeeList, departmentList]) => {
        if (ignore) return
        setEmployees(employeeList)
        setDepartmentNames(departmentList.map((department) => department.name).sort())
        setError('')
      })
      .catch(() => {
        if (!ignore) setError('Failed to load employees from the server.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const changeView = (next) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  /* ---------------- Filters ---------------- */

  const counts = useMemo(() => {
    const result = { all: employees.length }
    for (const employee of employees) result[employee.status] = (result[employee.status] || 0) + 1
    return result
  }, [employees])

  const departmentOptions = useMemo(
    () => [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(),
    [employees],
  )

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    return employees.filter((employee) => {
      const matchesSearch =
        !text ||
        [employee.name, employee.role, employee.department, employee.email, employee.employeeId].some((field) =>
          String(field || '').toLowerCase().includes(text),
        )
      const matchesDepartment = departmentFilter === 'All' || employee.department === departmentFilter
      const matchesStatus = status === 'all' || employee.status === status
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [employees, search, departmentFilter, status])

  const isFiltered = Boolean(search) || departmentFilter !== 'All' || status !== 'all'

  /* ---------------- Org chart ---------------- */

  // One column per department (from the Departments page), plus one
  // for people whose department doesn't exist there any more.
  const orgColumns = useMemo(() => {
    const known = new Set(departmentNames)
    const columns = departmentNames.map((name) => ({
      name,
      people: filtered.filter((employee) => employee.department === name),
    }))
    const unmatched = filtered.filter((employee) => !known.has(employee.department))
    if (unmatched.length > 0) {
      columns.push({ name: 'Not in a department', people: unmatched, warning: true })
    }
    return columns
  }, [departmentNames, filtered])

  /* ---------------- Actions ---------------- */

  const openAdd = () => setForm({ mode: 'add', values: { ...emptyEmployee } })
  const openEdit = (employee) => setForm({ mode: 'edit', values: { ...employee, phone: employee.phone || '' } })
  const closeForm = () => !saving && setForm(null)

  const setField = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, values: { ...current.values, [field]: value } }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      if (form.mode === 'add') {
        const created = await createEmployee({
          // The server assigns the next free ID (EMP004, EMP005, ...)
          ...form.values,
          initials: getInitials(form.values.name),
          status: 'Active',
          joiningDate: new Date().toISOString().split('T')[0],
          manager: 'Administrator',
        })
        setEmployees((current) => [created, ...current])
        toast.success(`${created.name} added as ${created.employeeId}`)
      } else {
        const updated = await updateEmployee(form.values._id, form.values)
        setEmployees((current) => current.map((employee) => (employee._id === updated._id ? updated : employee)))
        toast.success(`${updated.name} updated`)
      }
      setForm(null)
    } catch (err) {
      toast.error(err.message || 'Could not save the employee')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (employee) => {
    const ok = await confirm({
      title: `Delete ${employee.name}?`,
      message: 'This removes the employee record and cannot be undone. To record someone leaving, use Start offboarding on their profile instead.',
      confirmLabel: 'Delete employee',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteEmployee(employee._id)
      setEmployees((current) => current.filter((item) => item._id !== employee._id))
      toast.success('Employee deleted')
    } catch (err) {
      toast.error(err.message || 'Could not delete the employee')
    }
  }

  const actions = (employee) => (
    <div className="table-actions">
      <Button size="small" variant="secondary" onClick={() => openEdit(employee)} aria-label={`Edit ${employee.name}`}>
        Edit
      </Button>
      <Button size="small" variant="ghost" onClick={() => handleDelete(employee)} aria-label={`Delete ${employee.name}`}>
        Delete
      </Button>
    </div>
  )

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (employee) => (
        <div className="person-cell">
          <Avatar employee={employee} />
          <div>
            <Link className="table-primary person-link" to={`/employees/${employee.employeeId}`}>
              {employee.name}
            </Link>
            <div className="table-secondary">{employee.employeeId} · {employee.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'employmentType', label: 'Employment' },
    { key: 'status', label: 'Status', render: (employee) => <Badge>{employee.status}</Badge> },
    { key: 'actions', label: 'Actions', render: actions },
  ]

  const emptyState = (
    <EmptyState
      icon={<Users size={20} aria-hidden="true" />}
      title={isFiltered ? 'No employees match' : 'No employees yet'}
      description={isFiltered ? 'Try a different search, department or status.' : 'Add your first employee to get started.'}
      action={!isFiltered && <Button onClick={openAdd}>Add employee</Button>}
    />
  )

  /* ---------------- Page ---------------- */

  const values = form?.values

  return (
    <div className="employees-page">
      <PageHeader
        title="Employees"
        description="Everyone in the organisation. Open a name for their full profile: leave, payroll, assets, documents and history."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={openAdd}>
            Add employee
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="ui-card" aria-labelledby="employees-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="employees-title">
              {loading ? 'People' : `${filtered.length} ${filtered.length === 1 ? 'person' : 'people'}`}
            </h2>
            <p>{isFiltered ? `Filtered from ${employees.length}` : 'Across all departments'}</p>
          </div>

          <div className="view-toggle" role="group" aria-label="Show employees as">
            {VIEWS.map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                className={view === value ? 'is-active' : ''}
                onClick={() => changeView(value)}
              >
                <Icon size={15} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-chips" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="filter-chip"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {label}
              <span className="filter-chip-count">{counts[value] || 0}</span>
            </button>
          ))}
        </div>

        <div className="recruitment-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, role, email or ID…" />
          <select
            aria-label="Filter by department"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="All">All departments</option>
            {departmentOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {view === 'list' && (
          <DataTable caption="Employees" columns={columns} data={filtered} loading={loading} emptyState={emptyState} />
        )}

        {view === 'card' &&
          (loading ? (
            <p className="ui-loading">Loading employees…</p>
          ) : filtered.length === 0 ? (
            emptyState
          ) : (
            <ul className="person-card-grid">
              {filtered.map((employee) => (
                <li className="person-card" key={employee._id}>
                  <div className="person-card-top">
                    <Avatar employee={employee} size="lg" />
                    <Badge>{employee.status}</Badge>
                  </div>
                  <h3>
                    <Link className="person-link" to={`/employees/${employee.employeeId}`}>{employee.name}</Link>
                  </h3>
                  <p className="person-card-role">{employee.role}</p>
                  <dl className="person-card-details">
                    <div><dt>Department</dt><dd>{employee.department || '—'}</dd></div>
                    <div><dt>Employment</dt><dd>{employee.employmentType || '—'}</dd></div>
                    <div><dt>Email</dt><dd>{employee.email || '—'}</dd></div>
                  </dl>
                  {actions(employee)}
                </li>
              ))}
            </ul>
          ))}

        {view === 'org' &&
          (loading ? (
            <p className="ui-loading">Loading org chart…</p>
          ) : (
            <div className="org-chart-v2">
              <div className="org-root-v2">
                <strong>Administrator</strong>
                <span>System manager</span>
              </div>

              {orgColumns.length === 0 ? (
                emptyState
              ) : (
                <div className="org-columns">
                  {orgColumns.map((column) => (
                    <section
                      key={column.name}
                      className={`org-column-v2${column.warning ? ' org-column-warning' : ''}`}
                      aria-label={column.name}
                    >
                      <header>
                        <strong>{column.name}</strong>
                        <span>{column.people.length} {column.people.length === 1 ? 'person' : 'people'}</span>
                      </header>
                      {column.people.length === 0 ? (
                        <p className="org-empty">No one{isFiltered ? ' matches' : ' yet'}</p>
                      ) : (
                        <ul>
                          {column.people.map((employee) => (
                            <li key={employee._id}>
                              <Avatar employee={employee} size="sm" />
                              <span>
                                <Link className="person-link" to={`/employees/${employee.employeeId}`}>
                                  {employee.name}
                                </Link>
                                <small>{employee.role}{employee.department && column.warning ? ` · ${employee.department}` : ''}</small>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </div>
          ))}
      </section>

      {form && (
        <Modal title={form.mode === 'add' ? 'Add employee' : `Edit ${values.name || 'employee'}`} onClose={closeForm}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="employee-name">Full name</label>
                <input id="employee-name" value={values.name} onChange={setField('name')} required />
              </div>

              <div className="form-group">
                <label htmlFor="employee-role">Role</label>
                <input id="employee-role" value={values.role} onChange={setField('role')} required />
              </div>

              <div className="form-group">
                <label htmlFor="employee-department">Department</label>
                <select id="employee-department" value={values.department} onChange={setField('department')} required>
                  {form.mode === 'add' && <option value="">Choose a department</option>}
                  {form.mode === 'edit' && values.department && !departmentNames.includes(values.department) && (
                    <option value={values.department}>
                      {values.department} (not a department, please choose one)
                    </option>
                  )}
                  {departmentNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="employee-type">Employment type</label>
                <select id="employee-type" value={values.employmentType} onChange={setField('employmentType')}>
                  {EMPLOYMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="employee-email">Email</label>
                <input id="employee-email" type="email" value={values.email} onChange={setField('email')} required />
              </div>

              <div className="form-group">
                <label htmlFor="employee-phone">Phone</label>
                <input id="employee-phone" type="tel" value={values.phone} onChange={setField('phone')} required />
              </div>

              {form.mode === 'edit' && (
                <div className="form-group">
                  <label htmlFor="employee-status">Status</label>
                  <select id="employee-status" value={values.status} onChange={setField('status')}>
                    {EMPLOYEE_STATUSES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={closeForm} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>
                {form.mode === 'add' ? 'Add employee' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Employees
