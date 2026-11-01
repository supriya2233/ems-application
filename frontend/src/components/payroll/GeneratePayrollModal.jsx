import { useEffect, useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { useToast } from '../common/feedbackContext'
import { generatePayroll, previewPayroll } from '../../services/payrollService'
import { formatDay, plural } from '../../utils/leave'
import { formatMoney } from '../../utils/money'
import { daysExplained, people } from '../../utils/payroll'

/*
 * "Generate payroll for <month>": shows everyone's calculation
 * first (nothing is saved), lets you type a salary for people with
 * no earlier payroll, then creates Draft records in one go.
 */
function GeneratePayrollModal({ month, onClose, onGenerated }) {
  const toast = useToast()

  const [salaries, setSalaries] = useState({}) // { EMP003: { basic, allowances } }
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  // Recalculate shortly after typing stops.
  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => {
      previewPayroll(month, salaries)
        .then((data) => {
          if (!ignore) {
            setPreview(data)
            setError('')
          }
        })
        .catch((err) => {
          if (!ignore) setError(err.message || 'Could not calculate payroll')
        })
    }, 350)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [month, salaries])

  const setSalary = (employeeId, field, value) =>
    setSalaries((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: value } }))

  const groups = useMemo(() => {
    const rows = preview?.rows || []
    return {
      ready: rows.filter((row) => row.state === 'ready'),
      needsSalary: rows.filter((row) => row.state === 'needs-salary'),
      other: rows.filter((row) => row.state === 'exists' || row.state === 'skipped'),
    }
  }, [preview])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await generatePayroll(month, salaries)
      toast.success(`${plural(result.created.length, 'draft record')} created for ${result.month}`)
      onGenerated(result.created)
    } catch (err) {
      setError(err.message || 'Could not generate payroll')
      setGenerating(false)
    }
  }

  return (
    <Modal title={`Generate payroll · ${month}`} onClose={() => !generating && onClose()} size="lg">
      <p className="hire-intro">
        <Calculator size={18} aria-hidden="true" />
        <span>
          Salaries are copied from each person’s last payroll. Pay is reduced for approved
          <strong> unpaid leave</strong> and days marked <strong>Absent</strong>, and pro-rated for people
          who join or leave during the month. Nothing is saved until you press Create.
        </span>
      </p>

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      {!preview ? (
        <p className="ui-loading">Calculating…</p>
      ) : (
        <>
          <p className="payroll-generate-summary">
            <strong>{preview.workingDays} working days</strong> in {preview.month}
            {' · '}
            {people(groups.ready.length)} ready
            {' · '}
            <strong>{formatMoney(preview.totals.net)}</strong> net
          </p>

          <div className="ui-table-wrapper">
            <table className="ui-table payroll-generate-table">
              <caption className="visually-hidden">Payroll calculation for {preview.month}</caption>
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Salary</th>
                  <th scope="col">Paid days</th>
                  <th scope="col">Deductions</th>
                  <th scope="col">Net</th>
                </tr>
              </thead>
              <tbody>
                {groups.ready.map((row) => (
                  <tr key={row.employeeId}>
                    <td>
                      <div className="table-primary">{row.name}</div>
                      <div className="table-secondary">
                        {row.employeeId} · {row.department}
                        {row.lastWorkingDay && <> · <Badge variant="warning">Final settlement</Badge></>}
                      </div>
                    </td>
                    <td>
                      <div className="table-primary">{formatMoney(row.gross)}</div>
                      <div className="table-secondary">{row.salarySource}</div>
                    </td>
                    <td>
                      <div className="table-primary">{row.breakdown.payableDays} / {row.breakdown.workingDays}</div>
                      <div className="table-secondary">
                        {daysExplained(row.breakdown).split(' · ')[1] || 'Full month'}
                        {row.lastWorkingDay && ` · leaves ${formatDay(row.lastWorkingDay, false)}`}
                      </div>
                    </td>
                    <td>
                      <div className="table-primary">{formatMoney(row.deductions)}</div>
                      {row.breakdown.lossOfPay > 0 && (
                        <div className="table-secondary">{formatMoney(row.breakdown.lossOfPay)} loss of pay</div>
                      )}
                    </td>
                    <td className="payroll-net">{formatMoney(row.net)}</td>
                  </tr>
                ))}

                {groups.needsSalary.map((row) => (
                  <tr key={row.employeeId} className="payroll-row-needs">
                    <td>
                      <div className="table-primary">{row.name}</div>
                      <div className="table-secondary">{row.employeeId} · {row.department}</div>
                    </td>
                    <td colSpan={4}>
                      <div className="payroll-salary-inputs">
                        <label>
                          <span>Basic / month</span>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            aria-label={`Basic salary for ${row.name}`}
                            value={salaries[row.employeeId]?.basic ?? ''}
                            onChange={(event) => setSalary(row.employeeId, 'basic', event.target.value)}
                            placeholder="e.g. 40000"
                          />
                        </label>
                        <label>
                          <span>Allowances</span>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            aria-label={`Allowances for ${row.name}`}
                            value={salaries[row.employeeId]?.allowances ?? ''}
                            onChange={(event) => setSalary(row.employeeId, 'allowances', event.target.value)}
                            placeholder="0"
                          />
                        </label>
                        <span className="table-secondary">No earlier payroll. Enter a salary to include them, or leave empty to skip.</span>
                      </div>
                    </td>
                  </tr>
                ))}

                {groups.other.map((row) => (
                  <tr key={row.employeeId} className="payroll-row-skipped">
                    <td>
                      <div className="table-primary">{row.name}</div>
                      <div className="table-secondary">{row.employeeId} · {row.department}</div>
                    </td>
                    <td colSpan={4} className="table-secondary">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose} disabled={generating}>Cancel</Button>
        <Button onClick={handleGenerate} loading={generating} disabled={!preview || groups.ready.length === 0}>
          {groups.ready.length > 0 ? `Create ${plural(groups.ready.length, 'draft record')}` : 'Nobody to generate'}
        </Button>
      </div>
    </Modal>
  )
}

export default GeneratePayrollModal
