function StatCard({
  title,
  value,
  description,
  warning = false,
  neutral = false,
}) {

  let iconClass = 'stat-card-icon'

  if (warning) {
    iconClass += ' warning'
  }

  if (neutral) {
    iconClass += ' neutral'
  }

  let descriptionClass = 'stat-card-description'

  if (warning) {
    descriptionClass += ' warning'
  }

  if (neutral) {
    descriptionClass += ' neutral'
  }

  return (
    <article className="stat-card">

      <div className="stat-card-header">

        <span className="stat-card-title">
          {title}
        </span>

        <span className={iconClass}>
          {warning ? '!' : neutral ? '•' : '•'}
        </span>

      </div>


      <div className="stat-card-value">
        {value}
      </div>


      <div className={descriptionClass}>
        {description}
      </div>

    </article>
  )
}

export default StatCard