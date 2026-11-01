import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, RefreshCw } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { useToast } from '../common/feedbackContext'
import Payslip from './Payslip'
import { recalculatePayroll } from '../../services/payrollService'
import { formatMoney } from '../../utils/money'
import { daysExplained } from '../../utils/payroll'

/*
 * One payroll record: how the net was reached, plus actions.
 * "Print payslip" renders the Payslip outside the app (a portal on
 * <body>) and opens the browser's print dialog.
 */
function PayrollDetailModal({ record, employee, onClose, onChanged, onDelete }) {
  const toast = useToast()
  const [printing, setPrinting] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const b = record.breakdown || {}
  const calculated = b.workingDays > 0
  const gross = Number(record.basic || 0) + Number(record.allowances || 0)

  // Print once the payslip is in the page, then remove it again.
  useEffect(() => {
    if (!printing) return undefined
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done, { once: true })
    const frame = requestAnimationFrame(() => window.print())
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', done)
    }
  }, [printing])

  const recalculate = async () => {
    setRecalculating(true)
    try {
      const updated = await recalculatePayroll(record._id)
      onChanged(updated)
      toast.success(
        updated.net === record.net
          ? 'Recalculated: no change'
          : `Recalculated: net ${formatMoney(record.net)} → ${formatMoney(updated.net)}`,
      )
    } catch (err) {
      toast.error(err.message || 'Could not recalculate')
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <>
      <Modal title={`${record.employeeName} · ${record.month}`} onClose={onClose}>
        <div className="payroll-detail-head">
          <Badge>{record.status}</Badge>
          {record.type === 'Final settlement' && <Badge variant="warning">Final settlement</Badge>}
          <span className="table-secondary">{record.employeeId} · {record.department}</span>
        </div>

        <dl className="payroll-calc">
          <div>
            <dt>Basic</dt>
            <dd>{formatMoney(record.basic)}</dd>
          </div>
          <div>
            <dt>Allowances</dt>
            <dd>{formatMoney(record.allowances)}</dd>
          </div>
          <div className="payroll-calc-total">
            <dt>Gross</dt>
            <dd>{formatMoney(gross)}</dd>
          </div>

          {calculated ? (
            <>
              <div>
                <dt>
                  Loss of pay
                  <small>{daysExplained(b)}{b.lossOfPay > 0 ? ` · ${formatMoney(b.dayRate)}/day` : ''}</small>
                </dt>
                <dd>− {formatMoney(b.lossOfPay)}</dd>
              </div>
              <div>
                <dt>Other deductions <small>tax and similar</small></dt>
                <dd>− {formatMoney(b.otherDeductions)}</dd>
              </div>
            </>
          ) : (
            <div>
              <dt>Deductions <small>entered by hand</small></dt>
              <dd>− {formatMoney(record.deductions)}</dd>
            </div>
          )}

          <div className="payroll-calc-net">
            <dt>Net pay</dt>
            <dd>{formatMoney(record.net)}</dd>
          </div>
        </dl>

        {record.status !== 'Processed' && (
          <p className="hire-help">
            Leave or attendance changed after this was made? Recalculate to pick it up. Processed payroll is final.
          </p>
        )}

        <div className="modal-actions payroll-detail-actions">
          <Button variant="ghost" onClick={() => onDelete(record)}>Delete</Button>
          {record.status !== 'Processed' && (
            <Button
              variant="secondary"
              icon={<RefreshCw size={16} aria-hidden="true" />}
              loading={recalculating}
              onClick={recalculate}
            >
              Recalculate
            </Button>
          )}
          <Button icon={<Printer size={16} aria-hidden="true" />} onClick={() => setPrinting(true)}>
            Print payslip
          </Button>
        </div>
      </Modal>

      {printing &&
        createPortal(
          <div className="payslip-print">
            <Payslip record={record} employee={employee} />
          </div>,
          document.body,
        )}
    </>
  )
}

export default PayrollDetailModal
