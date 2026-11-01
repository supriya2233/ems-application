import { useEffect, useMemo, useState } from 'react'
import { Calculator, CircleCheck, IndianRupee, Plus, ReceiptIndianRupee, Wallet } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import DataTable from '../components/common/DataTable'
import EmployeePicker from '../components/common/EmployeePicker'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import StatCard from '../components/common/StatCard'
import GeneratePayrollModal from '../components/payroll/GeneratePayrollModal'
import PayrollDetailModal from '../components/payroll/PayrollDetailModal'
import { useConfirm, useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getEmployees } from '../services/employeeService'
import {
  createPayroll,
  deletePayroll,
  getPayroll,
  getPayrollMonths,
  updatePayroll,
} from '../services/payrollService'
import { plural } from '../utils/leave'
import { formatMoney } from '../utils/money'
import { daysExplained, people } from '../utils/payroll'

const STATUSES = ['Draft', 'Pending', 'Processed']

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const thisMonth = () => {
  const now = new Date()
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
}

const emptyForm = (month) => ({
  employeeId: '',
  month,
  basic: '',
  allowances: '',
  deductions: '',
  status: 'Draft',
})

function Payroll() {
  const confirm = useConfirm()
  const toast = useToast()

  const [months, setMonths] = useState([thisMonth()])
  const [month, setMonth] = useState(thisMonth())
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All')
  const [status, setStatus] = useState('All')

  const [showGenerate, setShowGenerate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(null) // manual "Add record" form
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  const refreshKey = useLiveRefresh(['payroll', 'employees', 'leave'])

  // Months and employees once (and on live changes).
  useEffect(() => {
    let ignore = false
    Promise.all([getPayrollMonths(), getEmployees()])
      .then(([monthList, employeeList]) => {
        if (ignore) return
        setMonths(monthList)
        setEmployees(employeeList)
      })
      .catch(() => {
        // The month picker still offers the current month.
      })
    return () => {
      ignore = true
    }
  }, [refreshKey])

  // The selected month's records.
  useEffect(() => {
    let ignore = false
    setLoading(true)

    getPayroll({ month })
      .then((data) => {
        if (!ignore) {
          setRecords(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load payroll')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [month, refreshKey])

  const replace = (updated) => {
    setRecords((current) => current.map((record) => (record._id === updated._id ? updated : record)))
    setSelected((current) => (current?._id === updated._id ? updated : current))
  }

  /* ---------------- Summary & filters ---------------- */

  const summary = useMemo(() => {
    const sum = (pick) => records.reduce((total, record) => total + Number(pick(record) || 0), 0)
    return {
      net: sum((record) => record.net),
      gross: sum((record) => Number(record.basic || 0) + Number(record.allowances || 0)),
      deductions: sum((record) => record.deductions),
      lossOfPay: sum((record) => record.breakdown?.lossOfPay),
      processed: records.filter((record) => record.status === 'Processed').length,
      waiting: records.filter((record) => record.status !== 'Processed').length,
    }
  }, [records])

  const departments = useMemo(
    () => [...new Set(records.map((record) => record.department).filter(Boolean))].sort(),
    [records],
  )

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    return records
      .filter((record) => {
        const matchesSearch =
          !text || [record.employeeName, record.employeeId].some((field) => String(field || '').toLowerCase().includes(text))
        const matchesDepartment = department === 'All' || record.department === department
        const matchesStatus = status === 'All' || record.status === status
        return matchesSearch && matchesDepartment && matchesStatus
      })
      .sort((a, b) => String(a.employeeName).localeCompare(String(b.employeeName)))
  }, [records, search, department, status])

  const employeeById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.employeeId, employee])),
    [employees],
  )

  /* ---------------- Actions ---------------- */

  const runPayroll = async () => {
    const waiting = records.filter((record) => record.status !== 'Processed')
    if (waiting.length === 0) {
      toast.error(`Payroll for ${month} is already processed`)
      return
    }

    const ok = await confirm({
      title: `Run payroll for ${month}?`,
      message: `${plural(waiting.length, 'record')} (${formatMoney(waiting.reduce((sum, record) => sum + record.net, 0))} net) will be marked Processed. Processed payroll can’t be recalculated.`,
      confirmLabel: 'Run payroll',
    })
    if (!ok) return

    setRunning(true)
    try {
      const updated = await Promise.all(
        waiting.map((record) => updatePayroll(record._id, { status: 'Processed' })),
      )
      updated.forEach(replace)
      toast.success(`${month} payroll processed for ${people(updated.length)}`)
    } catch (err) {
      toast.error(err.message || 'Failed to process payroll')
    } finally {
      setRunning(false)
    }
  }

  const handleDelete = async (record) => {
    const ok = await confirm({
      title: 'Delete payroll record?',
      message: `${record.employeeName}’s ${record.month} payroll will be permanently removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deletePayroll(record._id)
      setRecords((current) => current.filter((item) => item._id !== record._id))
      setSelected(null)
      toast.success('Payroll record deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete payroll')
    }
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const created = await createPayroll({
        employeeId: form.employeeId,
        month: form.month,
        basic: Number(form.basic),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
        status: form.status,
      })
      if (created.month === month) setRecords((current) => [created, ...current])
      toast.success(`Payroll added for ${created.employeeName}`)
      setForm(null)
    } catch (err) {
      toast.error(err.message || 'Failed to create payroll')
    } finally {
      setSaving(false)
    }
  }

  /* ---------------- Table ---------------- */

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (record) => (
        <>
          <div className="table-primary">{record.employeeName}</div>
          <div className="table-secondary">
            {record.employeeId} · {record.department}
            {record.type === 'Final settlement' && <> · <Badge variant="warning">Final settlement</Badge></>}
          </div>
        </>
      ),
    },
    { key: 'basic', label: 'Basic', render: (record) => formatMoney(record.basic) },
    { key: 'allowances', label: 'Allowances', render: (record) => formatMoney(record.allowances) },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (record) => (
        <>
          <div className="table-primary">{formatMoney(record.deductions)}</div>
          {record.breakdown?.workingDays > 0 && (
            <div className="table-secondary">{daysExplained(record.breakdown)}</div>
          )}
        </>
      ),
    },
    { key: 'net', label: 'Net', render: (record) => <strong className="payroll-net">{formatMoney(record.net)}</strong> },
    { key: 'status', label: 'Status', render: (record) => <Badge>{record.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (record) => (
        <div className="table-actions">
          <Button size="small" variant="secondary" onClick={() => setSelected(record)}>View</Button>
          <Button
            size="small"
            variant="ghost"
            aria-label={`Delete ${record.employeeName}’s payroll`}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = search || department !== 'All' || status !== 'All'

  return (
    <div className="payroll-page">
      <PageHeader
        title="Payroll"
        description="Generate a month’s payroll from salaries, unpaid leave and attendance, then run it and print payslips."
        action={
          <div className="payroll-header-actions">
            <label className="visually-hidden" htmlFor="payroll-month">Month</label>
            <select id="payroll-month" value={month} onChange={(event) => setMonth(event.target.value)}>
              {(months.includes(month) ? months : [month, ...months]).map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
            <Button variant="secondary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setForm(emptyForm(month))}>
              Add record
            </Button>
            <Button icon={<Calculator size={16} aria-hidden="true" />} onClick={() => setShowGenerate(true)}>
              Generate payroll
            </Button>
          </div>
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label={`Payroll for ${month}`}>
        <StatCard
          title="Net payroll"
          value={formatMoney(summary.net)}
          icon={<Wallet size={16} aria-hidden="true" />}
          description={`${people(records.length)} in ${month}`}
        />
        <StatCard
          title="Gross"
          value={formatMoney(summary.gross)}
          icon={<IndianRupee size={16} aria-hidden="true" />}
          description="basic + allowances"
        />
        <StatCard
          title="Deductions"
          value={formatMoney(summary.deductions)}
          icon={<ReceiptIndianRupee size={16} aria-hidden="true" />}
          description={summary.lossOfPay > 0 ? `${formatMoney(summary.lossOfPay)} of it loss of pay` : 'no loss of pay'}
        />
        <StatCard
          title="Processed"
          value={`${summary.processed} / ${records.length}`}
          icon={<CircleCheck size={16} aria-hidden="true" />}
          warning={summary.waiting > 0}
          description={summary.waiting > 0 ? `${summary.waiting} waiting to run` : records.length ? 'all done' : 'nothing yet'}
        />
      </section>

      <section className="ui-card" aria-labelledby="payroll-records-title">
        <div className="recruitment-panel-header">
          <div>
            <h2 id="payroll-records-title">{month}</h2>
            <p>Drafts can be recalculated; running payroll marks them Processed.</p>
          </div>
          <Button
            variant="secondary"
            loading={running}
            disabled={summary.waiting === 0}
            onClick={runPayroll}
          >
            Run payroll{summary.waiting > 0 ? ` (${summary.waiting})` : ''}
          </Button>
        </div>

        <div className="recruitment-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name or ID…" />
          <select aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="All">All departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="All">All statuses</option>
            {STATUSES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <DataTable
          caption={`Payroll for ${month}`}
          columns={columns}
          data={filtered}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<IndianRupee size={20} aria-hidden="true" />}
              title={isFiltered ? 'No records match' : `No payroll for ${month} yet`}
              description={
                isFiltered
                  ? 'Try a different search or filter.'
                  : 'Generate it for everyone in one go: salaries are copied from last time and adjusted for unpaid leave and absences.'
              }
              action={!isFiltered && <Button onClick={() => setShowGenerate(true)}>Generate payroll</Button>}
            />
          }
        />
      </section>

      {showGenerate && (
        <GeneratePayrollModal
          month={month}
          onClose={() => setShowGenerate(false)}
          onGenerated={(created) => {
            setRecords((current) => [...created, ...current])
            setShowGenerate(false)
          }}
        />
      )}

      {selected && (
        <PayrollDetailModal
          record={selected}
          employee={employeeById[selected.employeeId]}
          onClose={() => setSelected(null)}
          onChanged={replace}
          onDelete={handleDelete}
        />
      )}

      {form && (
        <Modal title="Add payroll record" onClose={() => !saving && setForm(null)}>
          <form onSubmit={handleAdd}>
            <p className="hire-help payroll-form-help">
              For one-off entries. To pay everyone, use Generate payroll; it works out unpaid leave and absences for you.
            </p>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="payroll-employee">Employee</label>
                <EmployeePicker
                  id="payroll-employee"
                  value={form.employeeId}
                  onChange={(employee) => setForm((current) => ({ ...current, employeeId: employee?.employeeId || '' }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="payroll-form-month">Month</label>
                <select
                  id="payroll-form-month"
                  value={form.month}
                  onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}
                >
                  {months.map((label) => <option key={label} value={label}>{label}</option>)}
                </select>
              </div>
              {[
                ['basic', 'Basic salary', true],
                ['allowances', 'Allowances', false],
                ['deductions', 'Deductions', false],
              ].map(([field, label, required]) => (
                <div className="form-group" key={field}>
                  <label htmlFor={`payroll-${field}`}>{label}</label>
                  <input
                    id={`payroll-${field}`}
                    type="number"
                    min="0"
                    inputMode="numeric"
                    required={required}
                    value={form[field]}
                    onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                  />
                </div>
              ))}
              <div className="form-group">
                <label htmlFor="payroll-status">Status</label>
                <select
                  id="payroll-status"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  {STATUSES.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <span className="detail-label">Net</span>
                <output className="form-static payroll-net">
                  {formatMoney(Number(form.basic || 0) + Number(form.allowances || 0) - Number(form.deductions || 0))}
                </output>
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving} disabled={!form.employeeId}>Add record</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Payroll
