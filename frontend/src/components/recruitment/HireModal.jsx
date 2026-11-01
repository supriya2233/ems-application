import { useEffect, useState } from 'react'
import { UserCheck } from 'lucide-react'

import Button from '../common/Button'
import Modal from '../common/Modal'
import { useToast } from '../common/feedbackContext'
import { getDepartments } from '../../services/departmentService'
import { hireCandidate } from '../../services/recruitmentService'
import { todayKey } from '../../utils/leave'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern']

/* Two weeks from today: a sensible first guess for a joining date. */
function inTwoWeeks() {
  const date = new Date(`${todayKey()}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 14)
  return date.toISOString().slice(0, 10)
}

const formFor = (candidate) => ({
  role: candidate?.position || '',
  department: candidate?.department || '',
  joiningDate: inTwoWeeks(),
  employmentType: 'Full-time',
  email: candidate?.email || '',
  phone: candidate?.phone || '',
})

/*
 * "Hire" a selected candidate. One save creates the employee
 * (status Onboarding) and their onboarding checklist, and marks
 * the candidate Hired. onHired receives { employee, onboarding, candidate }.
 */
function HireModal({ candidate, onClose, onHired }) {
  const toast = useToast()

  const [form, setForm] = useState(() => formFor(candidate))
  const [departments, setDepartments] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    getDepartments()
      .then((data) => {
        if (!ignore) setDepartments(data.map((department) => department.name))
      })
      .catch(() => {
        // The select then offers only the candidate's own department.
      })
    return () => {
      ignore = true
    }
  }, [])

  // The candidate's department may not exist yet (it was typed by hand).
  const departmentOptions =
    form.department && !departments.includes(form.department)
      ? [...departments, form.department]
      : departments
  const unknownDepartment =
    departments.length > 0 && form.department && !departments.includes(form.department)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const result = await hireCandidate(candidate._id, form)
      toast.success(`${result.employee.name} hired as ${result.employee.employeeId}. Onboarding has started.`)
      onHired(result)
    } catch (err) {
      setError(err.message || 'Could not hire this candidate')
      setSaving(false)
    }
  }

  return (
    <Modal title={`Hire ${candidate.candidateName}`} onClose={() => !saving && onClose()}>
      <form onSubmit={handleSubmit} className="hire-form">
        <p className="hire-intro">
          <UserCheck size={18} aria-hidden="true" />
          <span>
            Saving creates the employee record with the status <strong>Onboarding</strong> and starts
            their onboarding checklist, with due dates worked out from the joining date.
          </span>
        </p>

        {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="hire-role">Role</label>
            <input id="hire-role" name="role" value={form.role} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="hire-department">Department</label>
            <select
              id="hire-department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              aria-describedby={unknownDepartment ? 'hire-department-help' : undefined}
            >
              <option value="">Choose a department</option>
              {departmentOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {unknownDepartment && (
              <small id="hire-department-help" className="hire-help hire-help-warning">
                “{form.department}” isn’t a department yet. Pick an existing one or add it on the Departments page.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="hire-joining">Joining date</label>
            <input
              id="hire-joining"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hire-type">Employment type</label>
            <select id="hire-type" name="employmentType" value={form.employmentType} onChange={handleChange}>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hire-email">Work email</label>
            <input
              id="hire-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              aria-describedby="hire-email-help"
            />
            <small id="hire-email-help" className="hire-help">Must not belong to another employee.</small>
          </div>

          <div className="form-group">
            <label htmlFor="hire-phone">Phone</label>
            <input id="hire-phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Hire and start onboarding
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default HireModal
