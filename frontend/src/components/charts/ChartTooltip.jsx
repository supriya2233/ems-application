/*
 * Hover card for charts. `x` / `y` are pixels inside the chart;
 * it flips to the left of the pointer near the right edge.
 */
function ChartTooltip({ x, y, width, title, rows }) {
  const flip = x > width - 180

  return (
    <div
      className={`chart-tooltip ${flip ? 'chart-tooltip-flip' : ''}`}
      style={{ left: x, top: y }}
      role="presentation"
    >
      <strong>{title}</strong>

      {rows.map((row) => (
        <div key={row.label} className="chart-tooltip-row">
          {row.color && (
            <span className="chart-swatch" style={{ background: row.color }} aria-hidden="true" />
          )}
          <span>{row.label}</span>
          <b>{row.value}</b>
        </div>
      ))}
    </div>
  )
}

export default ChartTooltip
