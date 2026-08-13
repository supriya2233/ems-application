function PageHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="ui-page-header">

      <div>

        {eyebrow && (
          <span className="ui-eyebrow">
            {eyebrow}
          </span>
        )}

        <h1>{title}</h1>

        {description && (
          <p>{description}</p>
        )}

      </div>

      {action && (
        <div className="ui-page-header-action">
          {action}
        </div>
      )}

    </div>
  )
}

export default PageHeader