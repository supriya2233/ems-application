/*
 * One thin stacked bar per row (e.g. tasks per department), all on
 * the same scale, with the row total as text.
 *
 *   rows    [{ name, [series.key]: number }]
 *   series  [{ key, label, color }]
 */
function StackedRows({ rows, series }) {
  const totalOf = (row) => series.reduce((sum, s) => sum + (row[s.key] || 0), 0)
  const max = Math.max(1, ...rows.map(totalOf))

  return (
    <ul className="stacked-rows">
      {rows.map((row) => {
        const total = totalOf(row)
        const tip = series.map((s) => `${s.label} ${row[s.key] || 0}`).join(' · ')

        return (
          <li key={row.name} title={`${row.name}: ${tip}`}>
            <span className="stacked-rows-name">{row.name}</span>

            <span className="stacked-rows-track">
              <span className="stacked-rows-bar" style={{ width: `${(total / max) * 100}%` }}>
                {series.map((s) =>
                  row[s.key] ? (
                    <span key={s.key} style={{ flexGrow: row[s.key], background: s.color }} />
                  ) : null,
                )}
              </span>
            </span>

            <b className="stacked-rows-total">{total}</b>
          </li>
        )
      })}
    </ul>
  )
}

export default StackedRows
