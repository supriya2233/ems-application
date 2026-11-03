import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BadgeIndianRupee,
  ClipboardList,
  Clock3,
  Download,
  FileCheck2,
  Printer,
  Users,
} from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import { useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getReportCatalog, runReport } from '../services/insightService'
import { formatMoney } from '../utils/money'

const CATEGORY_ICONS = {
  People: Users,
  Time: Clock3,
  Money: BadgeIndianRupee,
  Work: ClipboardList,
  Compliance: FileCheck2,
}

const LIVE_MODULES = [
  'employees', 'departments', 'attendance', 'leave', 'payroll',
  'tasks', 'documents', 'assets', 'offboarding',
]

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '—'

/* Text for one cell, used by the table and the CSV file. */
const cellText = (value, type) => {
  if (value === null || value === undefined || value === '') return '—'
  if (type === 'date') return formatDate(value)
  if (type === 'money') return formatMoney(value)
  if (type === 'percent') return `${value}%`
  if (type === 'number') return Number(value).toLocaleString('en-IN')
  return String(value)
}

/* CSV keeps plain numbers (no ₹ or commas) so spreadsheets can add them up. */
const csvValue = (value, type) => {
  if (value === null || value === undefined) return ''
  if (type === 'money' || type === 'number' || type === 'percent') return String(value)
  const text = type === 'date' ? formatDate(value) : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const downloadCsv = (report) => {
  const lines = [
    report.columns.map((column) => csvValue(column.label, 'text')).join(','),
    ...report.rows.map((row) => report.columns.map((column) => csvValue(row[column.key], column.type)).join(',')),
  ]

  if (report.totals) {
    lines.push(
      report.columns
        .map((column, index) =>
          index === 0 ? 'Total' : column.key in report.totals ? csvValue(report.totals[column.key], column.type) : '',
        )
        .join(','),
    )
  }

  // The byte-order mark makes Excel read ₹ and accented names correctly.
  const blob = new Blob(['﻿', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const suffix = (report.subtitle || report.generatedAt.slice(0, 10)).toLowerCase().replace(/[^a-z0-9]+/g, '-')

  link.href = url
  link.download = `${report.id}-${suffix}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function Reports() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const refreshKey = useLiveRefresh(LIVE_MODULES)

  const [catalog, setCatalog] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const selectedId = searchParams.get('report') || catalog[0]?.id
  const selected = catalog.find((item) => item.id === selectedId)

  // Filter values live in the URL, so a report can be bookmarked or shared.
  const paramsKey = selected
    ? selected.params.map((param) => `${param.key}=${searchParams.get(param.key) ?? ''}`).join('&')
    : ''

  useEffect(() => {
    let ignore = false

    getReportCatalog()
      .then((list) => {
        if (!ignore) setCatalog(list)
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Could not load reports')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey])

  useEffect(() => {
    if (!selected) return undefined
    let ignore = false
    setRunning(true)

    const params = Object.fromEntries(new URLSearchParams(paramsKey))

    runReport(selected.id, params)
      .then((result) => {
        if (!ignore) {
          setReport(result)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Could not run the report')
      })
      .finally(() => {
        if (!ignore) setRunning(false)
      })

    return () => {
      ignore = true
    }
  }, [selected, paramsKey, refreshKey])

  const groups = useMemo(() => {
    const byCategory = new Map()
    catalog.forEach((item) => {
      if (!byCategory.has(item.category)) byCategory.set(item.category, [])
      byCategory.get(item.category).push(item)
    })
    return [...byCategory]
  }, [catalog])

  const chooseReport = (id) => setSearchParams({ report: id })

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!next.get('report') && selected) next.set('report', selected.id)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  // The report on screen matches the selected one (not the previous one still loading).
  const shown = report && selected && report.id === selected.id ? report : null

  const handleDownload = () => {
    downloadCsv(shown)
    toast.success(`Downloaded ${shown.rows.length} rows as CSV`)
  }

  return (
    <div className="reports-page">
      <PageHeader
        eyebrow="System"
        title="Reports"
        description="Ready-made reports built from live records. Filter, preview, then download as CSV or print to PDF."
      />

      {error && <div className="ui-alert ui-alert-error">{error}</div>}

      {loading ? (
        <div className="ui-loading">Loading reports…</div>
      ) : (
        <div className="reports-layout">
          <nav className="report-catalog" aria-label="Reports">
            {groups.map(([category, items]) => {
              const Icon = CATEGORY_ICONS[category] || ClipboardList

              return (
                <div key={category} className="report-group">
                  <h2>{category}</h2>
                  <ul>
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="report-link"
                          aria-current={item.id === selectedId ? 'true' : undefined}
                          onClick={() => chooseReport(item.id)}
                        >
                          <span className="report-link-icon" aria-hidden="true">
                            <Icon size={16} />
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>{item.description}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </nav>

          {selected && (
            <section className="report-panel" aria-labelledby="report-title" aria-busy={running}>
              <header className="report-panel-header">
                <div>
                  <span className="ui-eyebrow">{selected.category}</span>
                  <h2 id="report-title">{selected.title}</h2>
                  <p>{selected.description}</p>
                </div>

                <div className="report-actions">
                  <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()} disabled={!shown}>
                    Print
                  </Button>
                  <Button icon={<Download size={16} />} onClick={handleDownload} disabled={!shown || !shown.rows.length}>
                    Download CSV
                  </Button>
                </div>
              </header>

              {selected.params.length > 0 && (
                <div className="report-filters">
                  {selected.params.map((param) => (
                    <div key={param.key} className="form-group">
                      <label htmlFor={`report-${param.key}`}>{param.label}</label>
                      <select
                        id={`report-${param.key}`}
                        value={searchParams.get(param.key) ?? param.options[0]?.value ?? ''}
                        onChange={(event) => setParam(param.key, event.target.value)}
                      >
                        {param.options.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {shown && (
                <p className="report-meta">
                  <span>{shown.rows.length} {shown.rows.length === 1 ? 'row' : 'rows'}</span>
                  {shown.subtitle && <span>{shown.subtitle}</span>}
                  <span>
                    Generated {new Date(shown.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </p>
              )}

              {!shown ? (
                <div className="ui-loading">Running report…</div>
              ) : !shown.rows.length ? (
                <EmptyState
                  title="No rows for these filters"
                  description={
                    selected.params.length
                      ? 'Nothing was recorded for this selection. Try another month or filter.'
                      : 'There are no records for this report yet.'
                  }
                />
              ) : (
                <div className={`report-table-wrap ${running ? 'analytics-busy' : ''}`}>
                  <table className="report-table">
                    <thead>
                      <tr>
                        {shown.columns.map((column) => (
                          <th key={column.key} scope="col" className={isNumeric(column) ? 'num' : undefined}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.rows.map((row, index) => (
                        <tr key={row.employeeId ? `${row.employeeId}-${index}` : index}>
                          {shown.columns.map((column) => (
                            <td key={column.key} className={isNumeric(column) ? 'num' : undefined}>
                              {column.type === 'status' && row[column.key] ? (
                                <Badge>{row[column.key]}</Badge>
                              ) : (
                                cellText(row[column.key], column.type)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    {shown.totals && (
                      <tfoot>
                        <tr>
                          {shown.columns.map((column, index) => (
                            <td key={column.key} className={isNumeric(column) ? 'num' : undefined}>
                              {index === 0
                                ? 'Total'
                                : column.key in shown.totals
                                  ? cellText(shown.totals[column.key], column.type)
                                  : ''}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function isNumeric(column) {
  return column.type === 'number' || column.type === 'money' || column.type === 'percent'
}

export default Reports
