import { useEffect, useMemo, useState } from 'react'
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../services/departmentService'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'

const emptyDepartment = {
  departmentId: '',
  name: '',
  code: '',
  description: '',
  manager: '',
  color: 'blue',
  employees: 0,
  active: 0,
  openTasks: 0,
  completedTasks: 0,
}

function Departments() {
  const [departments, setDepartments] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)

  const [formData, setFormData] = useState(emptyDepartment)

  /*
   * =====================================================
   * LOAD DEPARTMENTS
   * =====================================================
   */

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getDepartments()

        setDepartments(data)
      } catch (err) {
        setError(err.message || 'Failed to load departments')
      } finally {
        setLoading(false)
      }
    }

    loadDepartments()
  }, [])

  /*
   * =====================================================
   * STATISTICS
   * =====================================================
   */

  const departmentStats = useMemo(() => {
    return {
      totalDepartments: departments.length,

      totalEmployees: departments.reduce(
        (total, department) =>
          total + Number(department.employees || 0),
        0,
      ),

      activeEmployees: departments.reduce(
        (total, department) =>
          total + Number(department.active || 0),
        0,
      ),

      employeesOnLeave: departments.reduce(
        (total, department) =>
          total +
          Math.max(
            Number(department.employees || 0) -
              Number(department.active || 0),
            0,
          ),
        0,
      ),
    }
  }, [departments])

  /*
   * =====================================================
   * FORM HANDLING
   * =====================================================
   */

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  /*
   * =====================================================
   * OPEN ADD MODAL
   * =====================================================
   */

  const handleOpenAdd = () => {
    setEditingDepartment(null)

    const nextNumber = departments.length + 1

    setFormData({
      ...emptyDepartment,
      departmentId: `DEP${String(nextNumber).padStart(3, '0')}`,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  /*
   * =====================================================
   * OPEN EDIT MODAL
   * =====================================================
   */

  const handleOpenEdit = (department) => {
    setEditingDepartment(department)

    setFormData({
      departmentId: department.departmentId || '',
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      manager: department.manager || '',
      color: department.color || 'blue',
      employees: department.employees || 0,
      active: department.active || 0,
      openTasks: department.openTasks || 0,
      completedTasks: department.completedTasks || 0,
    })

    setError('')
    setSuccess('')
    setShowModal(true)
  }

  /*
   * =====================================================
   * CLOSE MODAL
   * =====================================================
   */

  const handleCloseModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingDepartment(null)
    setFormData(emptyDepartment)
  }

  /*
   * =====================================================
   * CREATE / UPDATE
   * =====================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const departmentData = {
        departmentId: formData.departmentId.trim(),
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        manager: formData.manager.trim(),
        color: formData.color,
        employees: Number(formData.employees),
        active: Number(formData.active),
        openTasks: Number(formData.openTasks),
        completedTasks: Number(formData.completedTasks),
      }

      if (editingDepartment) {
        const updatedDepartment = await updateDepartment(
          editingDepartment._id,
          departmentData,
        )

        setDepartments((previous) =>
          previous.map((department) =>
            department._id === updatedDepartment._id
              ? updatedDepartment
              : department,
          ),
        )

        setSuccess('Department updated successfully')
      } else {
        const createdDepartment =
          await createDepartment(departmentData)

        setDepartments((previous) => [
          createdDepartment,
          ...previous,
        ])

        setSuccess('Department created successfully')
      }

      setShowModal(false)
      setEditingDepartment(null)
      setFormData(emptyDepartment)
    } catch (err) {
      setError(
        err.message ||
          `Failed to ${
            editingDepartment ? 'update' : 'create'
          } department`,
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * =====================================================
   * DELETE DEPARTMENT
   * =====================================================
   */

  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`,
    )

    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      await deleteDepartment(department._id)

      setDepartments((previous) =>
        previous.filter(
          (item) => item._id !== department._id,
        ),
      )

      setSuccess('Department deleted successfully')
    } catch (err) {
      setError(
        err.message || 'Failed to delete department',
      )
    }
  }

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="module-page">

      <PageHeader
        eyebrow="ORGANIZATION"
        title="Departments"
        description="Manage teams, department structure and workforce distribution."
        action={
          <Button onClick={handleOpenAdd}>
            + Add Department
          </Button>
        }
      />

      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="stats-grid">

        <div className="info-card">
          <span>Total Departments</span>
          <strong>
            {departmentStats.totalDepartments}
          </strong>
          <small>Across organization</small>
        </div>

        <div className="info-card">
          <span>Total Employees</span>
          <strong>
            {departmentStats.totalEmployees}
          </strong>
          <small>Across all departments</small>
        </div>

        <div className="info-card">
          <span>Active Employees</span>
          <strong>
            {departmentStats.activeEmployees}
          </strong>
          <small>Currently active</small>
        </div>

        <div className="info-card">
          <span>Employees on Leave</span>
          <strong>
            {departmentStats.employeesOnLeave}
          </strong>
          <small>Currently unavailable</small>
        </div>

      </div>

      {/* =================================================
          DEPARTMENTS
      ================================================= */}

      <section className="content-section">

        <div className="section-heading">

          <div>
            <h2>All Departments</h2>

            <p>
              Department overview and workforce
              distribution.
            </p>
          </div>

        </div>

        {loading ? (
          <div className="empty-state">
            Loading departments...
          </div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            No departments found. Add your first
            department.
          </div>
        ) : (

          <div className="department-grid">

            {departments.map((department) => {

              const employees =
                Number(department.employees) || 0

              const active =
                Number(department.active) || 0

              const activePercentage =
                employees > 0
                  ? Math.round(
                      (active / employees) * 100,
                    )
                  : 0

              return (
                <article
                  className="department-card"
                  key={department._id}
                >

                  {/* Card Top */}

                  <div className="department-card-top">

                    <div
                      className={`department-icon ${
                        department.color || 'blue'
                      }`}
                    >
                      {department.code}
                    </div>

                    <div className="department-actions">

                      <button
                        type="button"
                        className="more-button"
                        onClick={() =>
                          handleOpenEdit(department)
                        }
                        title="Edit department"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(department)
                        }
                        title="Delete department"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                  {/* Department Information */}

                  <h3>
                    {department.name}
                  </h3>

                  <p className="department-description">
                    {department.description}
                  </p>

                  {/* Manager */}

                  <div className="department-manager">

                    <span>
                      Department Manager
                    </span>

                    <strong>
                      {department.manager || 'Not assigned'}
                    </strong>

                  </div>

                  {/* Progress */}

                  <div className="department-progress">

                    <div className="progress-label">

                      <span>
                        Active workforce
                      </span>

                      <strong>
                        {activePercentage}%
                      </strong>

                    </div>

                    <div className="progress-track">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${activePercentage}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Metrics */}

                  <div className="department-metrics">

                    <div>
                      <strong>
                        {department.employees || 0}
                      </strong>

                      <span>
                        Employees
                      </span>
                    </div>

                    <div>
                      <strong>
                        {department.openTasks || 0}
                      </strong>

                      <span>
                        Open tasks
                      </span>
                    </div>

                    <div>
                      <strong>
                        {department.completedTasks || 0}
                      </strong>

                      <span>
                        Completed
                      </span>
                    </div>

                  </div>

                </article>
              )
            })}

          </div>

        )}

      </section>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={handleCloseModal}
        >

          <div
            className="modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {editingDepartment
                    ? 'Edit Department'
                    : 'Add Department'}
                </h2>

                <p>
                  {editingDepartment
                    ? 'Update department information.'
                    : 'Create a new department.'}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCloseModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <label>
                  Department ID

                  <input
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    required
                    disabled={Boolean(editingDepartment)}
                  />

                </label>

                <label>
                  Department Name

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Engineering"
                    required
                  />

                </label>

                <label>
                  Code

                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="ENG"
                    maxLength="5"
                    required
                  />

                </label>

                <label>
                  Manager

                  <input
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    placeholder="Department manager"
                  />

                </label>

                <label>
                  Color

                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                  >
                    <option value="blue">
                      Blue
                    </option>

                    <option value="orange">
                      Orange
                    </option>

                    <option value="purple">
                      Purple
                    </option>

                    <option value="green">
                      Green
                    </option>

                    <option value="yellow">
                      Yellow
                    </option>

                    <option value="red">
                      Red
                    </option>
                  </select>

                </label>

                <label>
                  Employees

                  <input
                    type="number"
                    name="employees"
                    min="0"
                    value={formData.employees}
                    onChange={handleInputChange}
                  />

                </label>

                <label>
                  Active Employees

                  <input
                    type="number"
                    name="active"
                    min="0"
                    value={formData.active}
                    onChange={handleInputChange}
                  />

                </label>

                <label>
                  Open Tasks

                  <input
                    type="number"
                    name="openTasks"
                    min="0"
                    value={formData.openTasks}
                    onChange={handleInputChange}
                  />

                </label>

                <label>
                  Completed Tasks

                  <input
                    type="number"
                    name="completedTasks"
                    min="0"
                    value={formData.completedTasks}
                    onChange={handleInputChange}
                  />

                </label>

              </div>

              <label className="form-full-width">
                Description

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Department description"
                  rows="4"
                />

              </label>

              <div className="modal-actions">

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingDepartment
                      ? 'Update Department'
                      : 'Add Department'}
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Departments