import { useEffect, useMemo, useState } from 'react'
import { Building2, Plane, Plus, UserCheck, Users } from 'lucide-react'

import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../services/departmentService'

const COLORS = ['blue', 'orange', 'purple', 'green', 'yellow', 'red']

const emptyDepartment = {
  departmentId: '',
  name: '',
  code: '',
  description: '',
  manager: '',
  color: 'blue',
}

const people = (count) => `${count} ${count === 1 ? 'person' : 'people'}`

function Departments() {
  const confirm = useConfirm()
  const toast = useToast()

  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // form: null (closed) or { editing: department | null, values }
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  // Headcounts change when employees or tasks change anywhere.
  const refreshKey = useLiveRefresh(['departments', 'employees', 'tasks'])

  useEffect(() => {
    let ignore = false

    getDepartments()
      .then((data) => {
        if (!ignore) {
          setDepartments(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load departments')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const stats = useMemo(() => {
    const sum = (field) => departments.reduce((total, department) => total + Number(department[field] || 0), 0)
    return {
      departments: departments.length,
      employees: sum('employees'),
      active: sum('active'),
      onLeave: sum('onLeave'),
      openTasks: sum('openTasks'),
    }
  }, [departments])

  /* ---------------- Form ---------------- */

  const openAdd = () => setForm({ editing: null, values: { ...emptyDepartment } })

  const openEdit = (department) =>
    setForm({
      editing: department,
      values: {
        departmentId: department.departmentId || '',
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        manager: department.manager || '',
        color: department.color || 'blue',
      },
    })

  const closeForm = () => !saving && setForm(null)

  const setField = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, values: { ...current.values, [field]: value } }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    const { values, editing } = form
    const departmentData = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim(),
      manager: values.manager.trim(),
      color: values.color,
      // Headcount and task numbers are calculated by the server.
    }

    try {
      if (editing) {
        const updated = await updateDepartment(editing._id, departmentData)
        setDepartments((current) => current.map((item) => (item._id === updated._id ? updated : item)))
        toast.success(`${updated.name} updated`)
      } else {
        const created = await createDepartment(departmentData)
        setDepartments((current) => [created, ...current])
        toast.success(`${created.name} added`)
      }
      setForm(null)
    } catch (err) {
      toast.error(err.message || `Failed to ${editing ? 'update' : 'create'} department`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (department) => {
    const ok = await confirm({
      title: `Delete ${department.name}?`,
      message:
        department.employees > 0
          ? `${people(department.employees)} still belong to it. They keep the department name until you move them.`
          : 'The department will be permanently removed.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteDepartment(department._id)
      setDepartments((current) => current.filter((item) => item._id !== department._id))
      toast.success('Department deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete department')
    }
  }

  /* ---------------- Page ---------------- */

  const values = form?.values

  return (
    <div className="departments-page">
      <PageHeader
        title="Departments"
        description="Teams and how people and work are spread across them. Numbers are counted live from Employees and Tasks."
        action={
          <Button icon={<Plus size={16} aria-hidden="true" />} onClick={openAdd}>
            Add department
          </Button>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Departments at a glance">
        <StatCard
          title="Departments"
          value={stats.departments}
          icon={<Building2 size={16} aria-hidden="true" />}
          description={`${stats.openTasks} open ${stats.openTasks === 1 ? 'task' : 'tasks'}`}
        />
        <StatCard
          title="People"
          value={stats.employees}
          icon={<Users size={16} aria-hidden="true" />}
          description="in a department"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<UserCheck size={16} aria-hidden="true" />}
          description={stats.employees ? `${Math.round((stats.active / stats.employees) * 100)}% of people` : 'no one yet'}
        />
        <StatCard
          title="On leave"
          value={stats.onLeave}
          icon={<Plane size={16} aria-hidden="true" />}
          warning={stats.onLeave > 0}
          description="today"
        />
      </section>

      <section className="ui-card" aria-labelledby="departments-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="departments-title">All departments</h2>
            <p>Active share, headcount and open work per team.</p>
          </div>
        </div>

        {loading ? (
          <p className="ui-loading">Loading departments…</p>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={<Building2 size={20} aria-hidden="true" />}
            title="No departments yet"
            description="Add your first department; employees are then assigned to it."
            action={<Button onClick={openAdd}>Add department</Button>}
          />
        ) : (
          <ul className="dept-grid">
            {departments.map((department) => {
              const employees = Number(department.employees) || 0
              const active = Number(department.active) || 0
              const share = employees > 0 ? Math.round((active / employees) * 100) : 0

              return (
                <li className="dept-card" key={department._id}>
                  <div className="dept-card-top">
                    <span className={`dept-code dept-code-${COLORS.includes(department.color) ? department.color : 'blue'}`}>
                      {department.code}
                    </span>
                    <div className="table-actions">
                      <Button size="small" variant="secondary" onClick={() => openEdit(department)} aria-label={`Edit ${department.name}`}>
                        Edit
                      </Button>
                      <Button size="small" variant="ghost" onClick={() => handleDelete(department)} aria-label={`Delete ${department.name}`}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  <h3>{department.name}</h3>
                  <p className="dept-description">{department.description || 'No description yet.'}</p>

                  <p className="dept-manager">
                    <span>Manager</span>
                    <strong>{department.manager || 'Not assigned'}</strong>
                  </p>

                  <div className="dept-progress">
                    <div className="dept-progress-label">
                      <span>Active</span>
                      <strong>{employees ? `${share}%` : '—'}</strong>
                    </div>
                    <div
                      className="dept-progress-track"
                      role="progressbar"
                      aria-label={`${department.name}: active share`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={share}
                    >
                      <span style={{ width: `${share}%` }} />
                    </div>
                  </div>

                  <dl className="dept-metrics">
                    <div><dt>People</dt><dd>{employees}</dd></div>
                    <div><dt>On leave</dt><dd>{department.onLeave || 0}</dd></div>
                    <div><dt>Open tasks</dt><dd>{department.openTasks || 0}</dd></div>
                    <div><dt>Done</dt><dd>{department.completedTasks || 0}</dd></div>
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {form && (
        <Modal title={form.editing ? `Edit ${form.editing.name}` : 'Add department'} onClose={closeForm}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <span className="detail-label">Department ID</span>
                <output className="form-static">{form.editing ? values.departmentId : 'Assigned automatically'}</output>
              </div>

              <div className="form-group">
                <label htmlFor="department-name">Name</label>
                <input id="department-name" value={values.name} onChange={setField('name')} placeholder="Engineering" required />
              </div>

              <div className="form-group">
                <label htmlFor="department-code">Code</label>
                <input id="department-code" value={values.code} onChange={setField('code')} placeholder="ENG" maxLength="5" required />
              </div>

              <div className="form-group">
                <label htmlFor="department-manager">Manager</label>
                <input id="department-manager" value={values.manager} onChange={setField('manager')} placeholder="Department manager" />
              </div>

              <div className="form-group">
                <label htmlFor="department-color">Colour</label>
                <select id="department-color" value={values.color} onChange={setField('color')}>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group form-full-width">
                <label htmlFor="department-description">Description</label>
                <textarea
                  id="department-description"
                  value={values.description}
                  onChange={setField('description')}
                  placeholder="What this team does"
                  rows="3"
                />
              </div>

              <p className="form-hint form-full-width">
                Headcount and task numbers are counted automatically from Employees and Tasks.
              </p>
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={closeForm} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{form.editing ? 'Save changes' : 'Add department'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Departments
