import { formatDay, todayKey } from '../../utils/leave'
import { formatMoney } from '../../utils/money'

/*
 * A printable payslip. On screen it is hidden; when printing, the
 * stylesheet hides the app and shows only this (see "@media print"
 * in styles/lifecycle.css), so "Save as PDF" in the print dialog
 * gives a clean one-page PDF without any PDF library.
 */
function Payslip({ record, employee }) {
  const b = record.breakdown || {}
  const gross = Number(record.basic || 0) + Number(record.allowances || 0)
  const other = b.workingDays ? b.otherDeductions || 0 : record.deductions || 0

  return (
    <article className="payslip" aria-label={`Payslip for ${record.employeeName}, ${record.month}`}>
      <header className="payslip-header">
        <div>
          <p className="payslip-company">EMS · Employee Management System</p>
          <h1>Payslip · {record.month}</h1>
        </div>
        <div className="payslip-meta">
          <span>{record.type === 'Final settlement' ? 'Final settlement' : 'Monthly salary'}</span>
          <span>Status: {record.status}</span>
        </div>
      </header>

      <dl className="payslip-details">
        <div><dt>Employee</dt><dd>{record.employeeName}</dd></div>
        <div><dt>Employee ID</dt><dd>{record.employeeId}</dd></div>
        <div><dt>Department</dt><dd>{record.department}</dd></div>
        {employee?.role && <div><dt>Role</dt><dd>{employee.role}</dd></div>}
        {employee?.joiningDate && <div><dt>Joined</dt><dd>{formatDay(employee.joiningDate)}</dd></div>}
        {b.workingDays > 0 && <div><dt>Paid days</dt><dd>{b.payableDays} of {b.workingDays} working days</dd></div>}
      </dl>

      <table className="payslip-table">
        <thead>
          <tr>
            <th scope="col">Earnings</th>
            <th scope="col" className="payslip-amount">Amount</th>
            <th scope="col">Deductions</th>
            <th scope="col" className="payslip-amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic salary</td>
            <td className="payslip-amount">{formatMoney(record.basic)}</td>
            <td>Loss of pay{b.workingDays ? ` (${b.workingDays - b.payableDays} day${b.workingDays - b.payableDays === 1 ? '' : 's'})` : ''}</td>
            <td className="payslip-amount">{formatMoney(b.lossOfPay || 0)}</td>
          </tr>
          <tr>
            <td>Allowances</td>
            <td className="payslip-amount">{formatMoney(record.allowances)}</td>
            <td>Other deductions</td>
            <td className="payslip-amount">{formatMoney(other)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Gross</th>
            <td className="payslip-amount">{formatMoney(gross)}</td>
            <th scope="row">Total deductions</th>
            <td className="payslip-amount">{formatMoney(record.deductions)}</td>
          </tr>
        </tfoot>
      </table>

      {b.workingDays > 0 && (b.unpaidDays > 0 || b.absentDays > 0 || b.notEmployedDays > 0) && (
        <p className="payslip-note">
          Loss of pay covers
          {[
            b.notEmployedDays > 0 && ` ${b.notEmployedDays} day(s) outside employment`,
            b.unpaidDays > 0 && ` ${b.unpaidDays} day(s) of unpaid leave`,
            b.absentDays > 0 && ` ${b.absentDays} day(s) absent`,
          ].filter(Boolean).join(',')}
          , at {formatMoney(b.dayRate)} per working day.
        </p>
      )}

      <p className="payslip-net">
        <span>Net pay</span>
        <strong>{formatMoney(record.net)}</strong>
      </p>

      <footer className="payslip-footer">
        Generated on {formatDay(todayKey())}. This is a computer-generated payslip and needs no signature.
      </footer>
    </article>
  )
}

export default Payslip
