function EmptyState({
  title = 'Nothing here yet',
  description = 'There are no records to display.',
  action,
}) {
  return (
    <div className="ui-empty-state">

      <div className="ui-empty-icon">
        —
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {action && (
        <div className="ui-empty-action">
          {action}
        </div>
      )}

    </div>
  )
}

export default EmptyState