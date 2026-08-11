function PagePlaceholder({
  title,
  description,
  module,
}) {
  return (
    <div className="page-placeholder">

      <div className="page-placeholder-icon">
        {module?.charAt(0)}
      </div>

      <div>
        <p className="page-placeholder-label">
          EMS MODULE
        </p>

        <h1>{title}</h1>

        <p>
          {description}
        </p>

        <span className="page-placeholder-status">
          Frontend module ready
        </span>
      </div>

    </div>
  )
}

export default PagePlaceholder