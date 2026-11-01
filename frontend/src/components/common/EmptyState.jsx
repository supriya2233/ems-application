import { Inbox } from 'lucide-react'

function EmptyState({
  title = 'Nothing here yet',
  description = 'There are no records to display.',
  action,
  icon,
}) {
  return (
    <div className="ui-empty-state">

      <div className="ui-empty-icon" aria-hidden="true">
        {icon || <Inbox size={20} strokeWidth={1.75} />}
      </div>

      <h3>{title}</h3>

      {description && <p>{description}</p>}

      {action && (
        <div className="ui-empty-action">
          {action}
        </div>
      )}

    </div>
  )
}

export default EmptyState
