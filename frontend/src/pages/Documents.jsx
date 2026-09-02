import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import SearchBar from '../components/common/SearchBar'
import Badge from '../components/common/Badge'
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/documentService'

const initialForm = {
  documentId: '',
  employeeId: '',
  employeeName: '',
  documentName: '',
  documentType: 'Other',
  issueDate: '',
  expiryDate: '',
  status: 'Active',
  fileName: '',
  fileUrl: '',
  notes: '',
}

const documentTypes = [
  'Offer Letter',
  'Employment Contract',
  'Identity Proof',
  'Address Proof',
  'Education Certificate',
  'Experience Letter',
  'Payslip',
  'Other',
]

const statusOptions = [
  'Active',
  'Expired',
  'Pending Verification',
]

function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [viewDocument, setViewDocument] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getDocuments()
      setDocuments(data)
    } catch (err) {
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.documentId?.toLowerCase().includes(query) ||
        document.employeeId?.toLowerCase().includes(query) ||
        document.employeeName?.toLowerCase().includes(query) ||
        document.documentName?.toLowerCase().includes(query) ||
        document.documentType?.toLowerCase().includes(query)

      const matchesType =
        typeFilter === 'All' ||
        document.documentType === typeFilter

      const matchesStatus =
        statusFilter === 'All' ||
        document.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [documents, search, typeFilter, statusFilter])

  const summary = useMemo(() => {
    return {
      total: documents.length,

      active: documents.filter(
        (document) => document.status === 'Active',
      ).length,

      pending: documents.filter(
        (document) =>
          document.status === 'Pending Verification',
      ).length,

      expired: documents.filter(
        (document) => document.status === 'Expired',
      ).length,
    }
  }, [documents])

  const openAddModal = () => {
    setEditingDocument(null)

    setForm({
      ...initialForm,
      documentId: `DOC${String(
        documents.length + 1,
      ).padStart(3, '0')}`,
    })

    setShowModal(true)
  }

  const openEditModal = (document) => {
    setEditingDocument(document)

    setForm({
      documentId: document.documentId || '',
      employeeId: document.employeeId || '',
      employeeName: document.employeeName || '',
      documentName: document.documentName || '',
      documentType: document.documentType || 'Other',

      issueDate: document.issueDate
        ? new Date(document.issueDate)
            .toISOString()
            .split('T')[0]
        : '',

      expiryDate: document.expiryDate
        ? new Date(document.expiryDate)
            .toISOString()
            .split('T')[0]
        : '',

      status: document.status || 'Active',
      fileName: document.fileName || '',
      fileUrl: document.fileUrl || '',
      notes: document.notes || '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingDocument(null)
    setForm(initialForm)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (editingDocument) {
        const updated = await updateDocument(
          editingDocument._id,
          form,
        )

        setDocuments((current) =>
          current.map((document) =>
            document._id === updated._id
              ? updated
              : document,
          ),
        )
      } else {
        const created = await createDocument(form)

        setDocuments((current) => [created, ...current])
      }

      closeModal()
    } catch (err) {
      setError(
        err.message || 'Failed to save document',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Delete "${document.documentName}" for ${document.employeeName}?`,
    )

    if (!confirmed) return

    try {
      setError('')

      await deleteDocument(document._id)

      setDocuments((current) =>
        current.filter(
          (item) => item._id !== document._id,
        ),
      )
    } catch (err) {
      setError(
        err.message || 'Failed to delete document',
      )
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Active':
        return 'success'
      case 'Pending Verification':
        return 'warning'
      case 'Expired':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="page-container documents-page">
      <PageHeader
        title="Documents"
        subtitle="Manage and track employee documents."
        actions={
          <Button onClick={openAddModal}>
            + Add Document
          </Button>
        }
      />

      {error && (
        <div className="ui-alert ui-alert-error">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            Total Documents
          </div>

          <div className="stat-card-value">
            {summary.total}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            Active
          </div>

          <div className="stat-card-value">
            {summary.active}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            Pending Verification
          </div>

          <div className="stat-card-value">
            {summary.pending}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            Expired
          </div>

          <div className="stat-card-value">
            {summary.expired}
          </div>
        </div>
      </div>

      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <h2>Employee Documents</h2>

            <p>
              Store document information and monitor verification
              status.
            </p>
          </div>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search documents or employees..."
          />

          <select
            className="ui-select"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="All">All Types</option>

            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            className="ui-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All Statuses</option>

            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="ui-loading">
            Loading documents...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="ui-empty-state">
            <div className="ui-empty-state-title">
              No documents found
            </div>

            <div className="ui-empty-state-description">
              Add a document to start managing employee records.
            </div>
          </div>
        ) : (
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document._id}>
                    <td>
                      <div className="table-primary">
                        {document.documentName}
                      </div>

                      <div className="table-secondary">
                        {document.documentId}
                      </div>
                    </td>

                    <td>
                      <div className="table-primary">
                        {document.employeeName}
                      </div>

                      <div className="table-secondary">
                        {document.employeeId}
                      </div>
                    </td>

                    <td>
                      {document.documentType}
                    </td>

                    <td>
                      {document.issueDate
                        ? new Date(
                            document.issueDate,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      {document.expiryDate
                        ? new Date(
                            document.expiryDate,
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <Badge
                        variant={getStatusVariant(
                          document.status,
                        )}
                      >
                        {document.status}
                      </Badge>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="ui-button ui-button-secondary ui-button-small"
                          onClick={() =>
                            setViewDocument(document)
                          }
                        >
                          View
                        </button>

                        <button
                          className="ui-button ui-button-secondary ui-button-small"
                          onClick={() =>
                            openEditModal(document)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="ui-button ui-button-danger ui-button-small"
                          onClick={() =>
                            handleDelete(document)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={
            editingDocument
              ? 'Edit Document'
              : 'Add Document'
          }
          onClose={closeModal}
        >
          <form
            className="ui-form"
            onSubmit={handleSubmit}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Document ID</label>

                <input
                  name="documentId"
                  value={form.documentId}
                  onChange={handleChange}
                  required
                  disabled={Boolean(editingDocument)}
                />
              </div>

              <div className="form-group">
                <label>Employee ID</label>

                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  placeholder="EMP001"
                />
              </div>

              <div className="form-group">
                <label>Employee Name</label>

                <input
                  name="employeeName"
                  value={form.employeeName}
                  onChange={handleChange}
                  required
                  placeholder="Employee name"
                />
              </div>

              <div className="form-group">
                <label>Document Name</label>

                <input
                  name="documentName"
                  value={form.documentName}
                  onChange={handleChange}
                  required
                  placeholder="Employment Contract"
                />
              </div>

              <div className="form-group">
                <label>Document Type</label>

                <select
                  name="documentType"
                  value={form.documentType}
                  onChange={handleChange}
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Issue Date</label>

                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>

                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>File Name</label>

                <input
                  name="fileName"
                  value={form.fileName}
                  onChange={handleChange}
                  placeholder="employment-contract.pdf"
                />
              </div>

              <div className="form-group">
                <label>File URL</label>

                <input
                  name="fileUrl"
                  value={form.fileUrl}
                  onChange={handleChange}
                  placeholder="Optional file location"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Additional document notes..."
              />
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
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
                  : editingDocument
                    ? 'Update Document'
                    : 'Add Document'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewDocument && (
        <Modal
          title="Document Details"
          onClose={() => setViewDocument(null)}
        >
          <div className="detail-grid">
            <div>
              <span className="detail-label">
                Document ID
              </span>

              <strong>
                {viewDocument.documentId}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Document Name
              </span>

              <strong>
                {viewDocument.documentName}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Employee
              </span>

              <strong>
                {viewDocument.employeeName}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Employee ID
              </span>

              <strong>
                {viewDocument.employeeId}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Document Type
              </span>

              <strong>
                {viewDocument.documentType}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Status
              </span>

              <Badge
                variant={getStatusVariant(
                  viewDocument.status,
                )}
              >
                {viewDocument.status}
              </Badge>
            </div>

            <div>
              <span className="detail-label">
                Issue Date
              </span>

              <strong>
                {viewDocument.issueDate
                  ? new Date(
                      viewDocument.issueDate,
                    ).toLocaleDateString()
                  : '—'}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                Expiry Date
              </span>

              <strong>
                {viewDocument.expiryDate
                  ? new Date(
                      viewDocument.expiryDate,
                    ).toLocaleDateString()
                  : '—'}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                File Name
              </span>

              <strong>
                {viewDocument.fileName || '—'}
              </strong>
            </div>
          </div>

          <div className="detail-notes">
            <span className="detail-label">
              Notes
            </span>

            <p>
              {viewDocument.notes ||
                'No notes available.'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Documents