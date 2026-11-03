import { useId, useState } from 'react'

import ChartTooltip from './ChartTooltip'
import { formatCompact, niceTicks, seriesColor, useElementWidth } from '../../utils/charts'

const PAD = { top: 16, right: 36, bottom: 28, left: 40 }

/*
 * One series over time: a 2px line over a soft area, with a
 * crosshair and tooltip on hover and the latest value labelled.
 *
 *   data      [{ label, longLabel?, [valueKey]: number }]
 *   valueKey  which field to plot
 *   name      series name for the tooltip
 */
function TrendChart({ data, valueKey, name, format = String, height = 220, label, color = seriesColor(0) }) {
  const [ref, width] = useElementWidth()
  const [hover, setHover] = useState(null)
  const gradientId = useId()

  const plotW = Math.max(width - PAD.left - PAD.right, 0)
  const plotH = height - PAD.top - PAD.bottom
  const values = data.map((row) => row[valueKey] || 0)
  const { top, ticks } = niceTicks(Math.max(0, ...values))

  const xOf = (index) => PAD.left + (data.length > 1 ? (index / (data.length - 1)) * plotW : plotW / 2)
  const yOf = (value) => PAD.top + plotH - (value / top) * plotH

  const points = values.map((value, index) => [xOf(index), yOf(value)])
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join('')
  const area = points.length ? `${line}L${xOf(values.length - 1)},${yOf(0)}L${xOf(0)},${yOf(0)}Z` : ''
  const last = points[points.length - 1]
  const labelEvery = data.length > 8 && plotW / data.length < 48 ? 2 : 1

  const onMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left - PAD.left
    const step = data.length > 1 ? plotW / (data.length - 1) : plotW
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(x / step))))
  }

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.18" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={yOf(tick)} y2={yOf(tick)} />
              <text className="chart-axis" x={PAD.left - 8} y={yOf(tick)} dy="0.32em" textAnchor="end">
                {formatCompact(tick)}
              </text>
            </g>
          ))}

          {data.map((row, index) =>
            index % labelEvery === 0 || index === data.length - 1 ? (
              <text key={row.label} className="chart-axis" x={xOf(index)} y={height - 8} textAnchor="middle">
                {row.label}
              </text>
            ) : null,
          )}

          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {last && hover === null && (
            <>
              <circle cx={last[0]} cy={last[1]} r="4" fill={color} stroke="#fff" strokeWidth="2" />
              <text className="chart-value" x={last[0] + 8} y={last[1]} dy="0.32em">
                {format(values[values.length - 1])}
              </text>
            </>
          )}

          {hover !== null && points[hover] && (
            <>
              <line
                className="chart-crosshair"
                x1={points[hover][0]}
                x2={points[hover][0]}
                y1={PAD.top}
                y2={yOf(0)}
              />
              <circle cx={points[hover][0]} cy={points[hover][1]} r="5" fill={color} stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <ChartTooltip
          x={points[hover][0]}
          y={PAD.top}
          width={width}
          title={data[hover].longLabel || data[hover].label}
          rows={[{ label: name, color, value: format(values[hover]) }]}
        />
      )}
    </div>
  )
}

export default TrendChart
