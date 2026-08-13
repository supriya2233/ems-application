function StatCard({
  title,
  value,
  description,
  warning = false,
  neutral = false,
  icon,
  change,
}) {
  let iconClass = 'ui-stat-icon'

  if (warning) {
    iconClass += ' warning'
  }

  if (neutral) {
    iconClass += ' neutral'
  }

  return (
    <article className="ui-stat-card">

      <div className="ui-stat-top">

        <span className="ui-stat-title">
          {title}
        </span>

        <span className={iconClass}>
          {icon || (warning ? '!' : '•')}
        </span>

      </div>

      <strong className="ui-stat-value">
        {value}
      </strong>

      {change && (
        <span className="ui-stat-change">
          {change}
        </span>
      )}

      {description && (
        <small
          className={`ui-stat-description ${
            warning ? 'warning' : ''
          } ${neutral ? 'neutral' : ''}`}
        >
          {description}
        </small>
      )}

    </article>
  )
}

export default StatCard