import { useState } from 'react'

import ChartTooltip from './ChartTooltip'
import { formatCompact, niceTicks, useElementWidth } from '../../utils/charts'

const PAD = { top: 12, right: 8, bottom: 28, left: 40 }

/* Rectangle with 4px rounded top corners, sitting on the baseline. */
const roundedTop = (x, y, w, h, r = 4) => {
  const radius = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`
}

/*
 * Vertical columns, one group per data row.
 *
 *   data     [{ label, [series.key]: number }]
 *   series   [{ key, label, color }]
 *   stacked  stack the series instead of placing them side by side
 *   format   value → text for the tooltip
 */
function ColumnChart({ data, series, stacked = false, format = String, height = 220, label }) {
  const [ref, width] = useElementWidth()
  const [hover, setHover] = useState(null)

  const plotW = Math.max(width - PAD.left - PAD.right, 0)
  const plotH = height - PAD.top - PAD.bottom

  const totals = data.map((row) =>
    stacked
      ? series.reduce((sum, s) => sum + (row[s.key] || 0), 0)
      : Math.max(0, ...series.map((s) => row[s.key] || 0)),
  )
  const { top, ticks } = niceTicks(Math.max(0, ...totals))
  const yOf = (value) => PAD.top + plotH - (value / top) * plotH

  const band = data.length ? plotW / data.length : 0
  const groupCount = stacked ? 1 : series.length
  const barW = Math.max(4, Math.min(24, (band * 0.6 - (groupCount - 1) * 2) / groupCount))
  const groupW = groupCount * barW + (groupCount - 1) * 2

  // Show every label when there is room, otherwise every other one.
  const labelEvery = band < 44 ? 2 : 1

  return (
    <div className="chart" ref={ref} onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                className="chart-grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={yOf(tick)}
                y2={yOf(tick)}
              />
              <text className="chart-axis" x={PAD.left - 8} y={yOf(tick)} dy="0.32em" textAnchor="end">
                {formatCompact(tick)}
              </text>
            </g>
          ))}

          {data.map((row, index) => {
            const x0 = PAD.left + index * band + (band - groupW) / 2
            let stackBase = 0

            return (
              <g key={row.label}>
                {series.map((s, sIndex) => {
                  const value = row[s.key] || 0
                  if (!value) return null

                  let x
                  let y
                  let h

                  if (stacked) {
                    x = x0
                    y = yOf(stackBase + value)
                    h = yOf(stackBase) - y - (stackBase > 0 ? 2 : 0)
                    stackBase += value
                  } else {
                    x = x0 + sIndex * (barW + 2)
                    y = yOf(value)
                    h = yOf(0) - y
                  }

                  const isTop = !stacked || series.slice(sIndex + 1).every((next) => !row[next.key])

                  return (
                    <path
                      key={s.key}
                      d={isTop ? roundedTop(x, y, barW, Math.max(h, 1)) : `M${x},${y}h${barW}v${Math.max(h, 1)}h${-barW}Z`}
                      fill={s.color}
                      opacity={hover === null || hover === index ? 1 : 0.45}
                    />
                  )
                })}

                {index % labelEvery === 0 && (
                  <text className="chart-axis" x={PAD.left + index * band + band / 2} y={height - 8} textAnchor="middle">
                    {row.label}
                  </text>
                )}

                {/* Hit area: the whole column band */}
                <rect
                  x={PAD.left + index * band}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(index)}
                />
              </g>
            )
          })}

          <line className="chart-baseline" x1={PAD.left} x2={width - PAD.right} y1={yOf(0)} y2={yOf(0)} />
        </svg>
      )}

      {hover !== null && data[hover] && (
        <ChartTooltip
          x={PAD.left + hover * band + band / 2}
          y={PAD.top}
          width={width}
          title={data[hover].longLabel || data[hover].label}
          rows={series.map((s) => ({ label: s.label, color: s.color, value: format(data[hover][s.key] || 0) }))}
        />
      )}
    </div>
  )
}

export default ColumnChart
