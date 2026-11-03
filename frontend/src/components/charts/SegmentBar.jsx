/*
 * Parts of a whole as one horizontal bar, with a legend that
 * carries every value and share (so colour is never the only cue).
 *
 *   items  [{ name, count, color }]
 */
function SegmentBar({ items, format = String }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const shown = items.filter((item) => item.count > 0)
  const share = (count) => (total ? Math.round((count / total) * 100) : 0)

  return (
    <div className="segment">
      <div className="segment-bar" role="img" aria-label={items.map((i) => `${i.name} ${i.count}`).join(', ')}>
        {shown.map((item) => (
          <span
            key={item.name}
            className="segment-part"
            style={{ flexGrow: item.count, background: item.color }}
            title={`${item.name}: ${format(item.count)} (${share(item.count)}%)`}
          />
        ))}
      </div>

      <ul className="chart-legend chart-legend-values">
        {items.map((item) => (
          <li key={item.name}>
            <span className="chart-swatch" style={{ background: item.color }} aria-hidden="true" />
            <span>{item.name}</span>
            <b>{format(item.count)}</b>
            <small>{share(item.count)}%</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SegmentBar
