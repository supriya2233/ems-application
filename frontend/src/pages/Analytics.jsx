import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, TrendingDown, UserPlus, Users } from 'lucide-react'

import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import BarList from '../components/charts/BarList'
import ChartCard from '../components/charts/ChartCard'
import ColumnChart from '../components/charts/ColumnChart'
import SegmentBar from '../components/charts/SegmentBar'
import StackedRows from '../components/charts/StackedRows'
import TrendChart from '../components/charts/TrendChart'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getAnalytics } from '../services/insightService'
import { seriesColor } from '../utils/charts'
import { formatMoney } from '../utils/money'

const PERIODS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
]

const LIVE_MODULES = ['employees', 'departments', 'leave', 'attendance', 'payroll', 'tasks', 'offboarding']

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`
const people = (count) => `${count} ${count === 1 ? 'person' : 'people'}`

/* Gives a list of {name, count} a fixed colour per position. */
const withColors = (items) => items.map((item, index) => ({ ...item, color: seriesColor(index) }))

function Analytics() {
  const [months, setMonths] = useState(6)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const refreshKey = useLiveRefresh(LIVE_MODULES)

  useEffect(() => {
    let ignore = false
    setLoading(true)

    getAnalytics(months)
      .then((result) => {
        if (!ignore) {
          setData(result)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Could not load analytics')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [months, refreshKey])

  const periodPicker = (
    <div className="segmented" role="group" aria-label="Period">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          type="button"
          aria-pressed={months === period.value}
          onClick={() => setMonths(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="How the organisation is growing, where time goes, and what payroll costs, calculated live from your records."
        action={periodPicker}
      />

      {error && <div className="ui-alert ui-alert-error">{error}</div>}

      {!data && loading && <div className="ui-loading">Loading analytics…</div>}

      {data && <AnalyticsBody data={data} months={months} busy={loading} />}
    </div>
  )
}

function AnalyticsBody({ data, months, busy }) {
  const { summary, headcount, departments, employmentTypes, leave, attendance, payroll, tasks } = data

  const first = headcount[0]
  const last = headcount[headcount.length - 1]
  const growth = last && first ? last.headcount - first.headcount : 0

  const monthRows = headcount.map((row) => ({ ...row, longLabel: row.label }))

  const leaveSeries = leave.types.map((type, index) => ({ key: type, label: type, color: seriesColor(index) }))
  const leaveTotal = leave.months.reduce((sum, row) => sum + row.total, 0)
  const topLeave = leaveSeries
    .map((s) => ({ ...s, days: leave.months.reduce((sum, row) => sum + (row[s.key] || 0), 0) }))
    .sort((a, b) => b.days - a.days)[0]

  const attendanceItems = withColors(attendance.byStatus)
  const payrollTotal = payroll.reduce((sum, row) => sum + row.net, 0)

  const taskSeries = [
    { key: 'onTrack', label: 'Open, on track', color: seriesColor(0) },
    { key: 'overdue', label: 'Overdue', color: seriesColor(1) },
    { key: 'completed', label: 'Completed', color: seriesColor(2) },
  ]
  const taskRows = tasks.map((row) => ({ ...row, onTrack: row.open - row.overdue }))
  const overdueTotal = tasks.reduce((sum, row) => sum + row.overdue, 0)

  const largest = departments[0]

  return (
    <div className={busy ? 'analytics-busy' : undefined} aria-busy={busy}>
      <div className="stats-grid analytics-kpis">
        <StatCard
          title="Headcount"
          value={summary.headcount}
          icon={<Users size={18} />}
          description={
            summary.onboarding
              ? `${summary.active} active · ${summary.onboarding} onboarding`
              : `${summary.active} active right now`
          }
        />
        <StatCard
          title={`Hires, last ${months} months`}
          value={summary.hires}
          tone="success"
          icon={<UserPlus size={18} />}
          description={`${plural(summary.exits, 'leaver')} in the same period`}
        />
        <StatCard
          title="Attrition"
          value={`${summary.attritionRate}%`}
          tone="purple"
          icon={<TrendingDown size={18} />}
          description="Leavers as a share of average headcount"
        />
        <StatCard
          title="Average tenure"
          value={`${summary.averageTenureYears} yrs`}
          neutral
          icon={<Clock3 size={18} />}
          description="Time since joining, current staff"
        />
      </div>

      <div className="analytics-grid">
        <ChartCard
          className="span-7"
          title="Headcount"
          description={
            growth === 0
              ? `Steady at ${last?.headcount ?? 0} people across the period.`
              : `${growth > 0 ? 'Up' : 'Down'} from ${first.headcount} to ${last.headcount} people since ${first.label}.`
          }
          table={{
            columns: [
              { key: 'label', label: 'Month' },
              { key: 'headcount', label: 'Headcount', align: 'right' },
              { key: 'hires', label: 'Joined', align: 'right' },
              { key: 'exits', label: 'Left', align: 'right' },
            ],
            rows: headcount.map((row) => ({ ...row, key: row.month })),
          }}
        >
          <TrendChart data={monthRows} valueKey="headcount" name="Headcount" label="Headcount by month" />
        </ChartCard>

        <ChartCard
          className="span-5"
          title="People by department"
          description={largest ? `${largest.name} is the largest team, with ${people(largest.count)}.` : ''}
          empty={departments.length ? null : 'No employees yet.'}
          table={{
            columns: [
              { key: 'name', label: 'Department' },
              { key: 'count', label: 'People', align: 'right' },
            ],
            rows: departments.map((row) => ({ ...row, key: row.name })),
          }}
        >
          <BarList items={departments.map((row) => ({ name: row.name, value: row.count }))} />
        </ChartCard>

        <ChartCard
          className="span-7"
          title="Joiners and leavers"
          description={`${people(summary.hires)} joined and ${summary.exits} left in the last ${months} months.`}
          legend={[
            { label: 'Joined', color: seriesColor(0) },
            { label: 'Left', color: seriesColor(1) },
          ]}
          table={{
            columns: [
              { key: 'label', label: 'Month' },
              { key: 'hires', label: 'Joined', align: 'right' },
              { key: 'exits', label: 'Left', align: 'right' },
            ],
            rows: headcount.map((row) => ({ ...row, key: row.month })),
          }}
        >
          <ColumnChart
            data={monthRows}
            series={[
              { key: 'hires', label: 'Joined', color: seriesColor(0) },
              { key: 'exits', label: 'Left', color: seriesColor(1) },
            ]}
            label="Joiners and leavers by month"
          />
        </ChartCard>

        <ChartCard
          className="span-5"
          title="Employment type"
          description="The mix of contracts across current staff."
          empty={employmentTypes.some((row) => row.count) ? null : 'No employees yet.'}
        >
          <SegmentBar items={withColors(employmentTypes)} />
        </ChartCard>

        <ChartCard
          className="span-7"
          title="Leave taken"
          description={
            leaveTotal
              ? `${leaveTotal} working days of approved leave; ${topLeave.label.toLowerCase()} leave is the most used.`
              : ''
          }
          legend={leaveSeries}
          empty={
            leaveTotal ? null : (
              <EmptyChart text="No approved leave in this period yet." link="/leave" linkText="Open Leave Management" />
            )
          }
          table={{
            columns: [{ key: 'label', label: 'Month' }, ...leaveSeries.map((s) => ({ key: s.key, label: s.label, align: 'right' })), { key: 'total', label: 'Total', align: 'right' }],
            rows: leave.months.map((row) => ({ ...row, key: row.month })),
          }}
        >
          <ColumnChart
            data={leave.months.map((row) => ({ ...row, longLabel: row.label }))}
            series={leaveSeries}
            stacked
            format={(value) => plural(value, 'day')}
            label="Approved leave days by month and type"
          />
        </ChartCard>

        <ChartCard
          className="span-5"
          title="Attendance"
          description={
            attendance.marked
              ? `${attendance.rate}% attendance across ${plural(attendance.marked, 'marked day')}.`
              : ''
          }
          empty={
            attendance.marked ? null : (
              <EmptyChart text="No attendance marked in this period yet." link="/attendance" linkText="Mark attendance" />
            )
          }
        >
          <SegmentBar items={attendanceItems} />
        </ChartCard>

        <ChartCard
          className="span-7"
          title="Payroll cost"
          description={
            payrollTotal
              ? `${formatMoney(payrollTotal)} net pay over the period. Last run: ${summary.lastPayroll.label}, ${people(summary.lastPayroll.people)}.`
              : ''
          }
          empty={
            payrollTotal ? null : (
              <EmptyChart text="No payroll processed in this period yet." link="/payroll" linkText="Open Payroll" />
            )
          }
          table={{
            columns: [
              { key: 'label', label: 'Month' },
              { key: 'people', label: 'People paid', align: 'right' },
              { key: 'netText', label: 'Net pay', align: 'right' },
            ],
            rows: payroll.map((row) => ({ ...row, key: row.month, netText: formatMoney(row.net) })),
          }}
        >
          <ColumnChart
            data={payroll.map((row) => ({ ...row, longLabel: row.label }))}
            series={[{ key: 'net', label: 'Net pay', color: seriesColor(0) }]}
            format={formatMoney}
            label="Net payroll by month"
          />
        </ChartCard>

        <ChartCard
          className="span-5"
          title="Tasks by department"
          description={
            tasks.length
              ? overdueTotal
                ? `${plural(overdueTotal, 'task')} overdue across ${plural(tasks.filter((row) => row.overdue).length, 'team')}.`
                : 'Nothing overdue. Every open task is on schedule.'
              : ''
          }
          legend={taskSeries}
          empty={tasks.length ? null : <EmptyChart text="No tasks yet." link="/tasks" linkText="Open Tasks" />}
          table={{
            columns: [
              { key: 'name', label: 'Department' },
              { key: 'onTrack', label: 'On track', align: 'right' },
              { key: 'overdue', label: 'Overdue', align: 'right' },
              { key: 'completed', label: 'Done', align: 'right' },
            ],
            rows: taskRows.map((row) => ({ ...row, key: row.name })),
          }}
        >
          <StackedRows rows={taskRows} series={taskSeries} />
        </ChartCard>
      </div>
    </div>
  )
}

function EmptyChart({ text, link, linkText }) {
  return (
    <>
      <p>{text}</p>
      <Link to={link}>{linkText}</Link>
    </>
  )
}

export default Analytics
