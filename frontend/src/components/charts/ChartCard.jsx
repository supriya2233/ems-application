import { useState } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'

/*
 * Card around one chart: title, one-line takeaway, an optional
 * legend, and a Chart / Table switch so every number can also be
 * read as text.
 *
 *   legend  [{ label, color }]   shown for two or more series
 *   table   { columns: [{ key, label, align? }], rows: [...] }
 */
function ChartCard({ title, description, legend, table, empty, children, className = '' }) {
  const [view, setView] = useState('chart')

  return (
    <section className={`chart-card ${className}`.trim()}>
      <header className="chart-card-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>

        {table && !empty && (
          <div className="chart-view-switch" role="group" aria-label={`${title} view`}>
            <button
              type="button"
              aria-pressed={view === 'chart'}
              onClick={() => setView('chart')}
              title="Chart"
            >
              <ChartColumn size={15} aria-hidden="true" />
              <span className="visually-hidden">Chart</span>
            </button>
            <button
              type="button"
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
              title="Table"
            >
              <Table2 size={15} aria-hidden="true" />
              <span className="visually-hidden">Table</span>
            </button>
          </div>
        )}
      </header>

      {empty ? (
        <div className="chart-empty">{empty}</div>
      ) : view === 'table' && table ? (
        <div className="chart-table">
          <table>
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column.key} className={column.align === 'right' ? 'num' : undefined}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={row.key ?? index}>
                  {table.columns.map((column) => (
                    <td key={column.key} className={column.align === 'right' ? 'num' : undefined}>
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {legend && legend.length > 1 && (
            <ul className="chart-legend">
              {legend.map((item) => (
                <li key={item.label}>
                  <span className="chart-swatch" style={{ background: item.color }} aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
          {children}
        </>
      )}
    </section>
  )
}

export default ChartCard
