import { seriesColor } from '../../utils/charts'

/*
 * Ranked horizontal bars (largest first), one colour. Name and
 * value are text beside the bar, so it reads without hovering.
 *
 *   items  [{ name, value, hint? }]
 */
function BarList({ items, format = String, color = seriesColor(0) }) {
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.name} title={`${item.name}: ${format(item.value)}`}>
          <div className="bar-list-text">
            <span>{item.name}</span>
            <b>{format(item.value)}</b>
          </div>

          <div className="bar-list-track">
            <span
              className="bar-list-fill"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default BarList
