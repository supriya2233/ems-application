/*
 * Page title block.
 *
 * Some pages pass `subtitle` / `actions` instead of
 * `description` / `action`; both spellings are accepted.
 */
function PageHeader({
  eyebrow,
  title,
  description,
  subtitle,
  action,
  actions,
}) {
  const text = description ?? subtitle
  const actionArea = action ?? actions

  return (
    <div className="ui-page-header">

      <div>

        {eyebrow && (
          <span className="ui-eyebrow">
            {eyebrow}
          </span>
        )}

        <h1>{title}</h1>

        {text && (
          <p>{text}</p>
        )}

      </div>

      {actionArea && (
        <div className="ui-page-header-action">
          {actionArea}
        </div>
      )}

    </div>
  )
}

export default PageHeader
