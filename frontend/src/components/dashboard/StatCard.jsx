function StatCard({ title, value, change, type }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <p>{title}</p>

        <span className={`stat-icon stat-icon-${type}`}>
          {type === 'warning' ? '!' : '•'}
        </span>
      </div>

      <h3>{value}</h3>

      <p className={`stat-change stat-change-${type}`}>
        {change}
      </p>
    </div>
  )
}

export default StatCard