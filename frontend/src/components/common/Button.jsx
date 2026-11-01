import { LoaderCircle } from 'lucide-react'

/*
 * Shared button.
 *
 *   variant:   primary (default) | secondary | ghost | danger
 *   size:      medium (default)  | small
 *   icon:      optional element shown before the text
 *   loading:   shows a spinner and disables the button
 *   fullWidth: stretches to the container width
 *
 * Any other attribute (aria-label, title, form, ...) is passed
 * straight to the <button>.
 */
function Button({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const classes = [
    'ui-button',
    `ui-button-${variant}`,
    size === 'small' && 'ui-button-small',
    fullWidth && 'ui-button-full',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <LoaderCircle
          className="ui-button-spinner"
          size={16}
          aria-hidden="true"
        />
      ) : (
        icon
      )}

      {children}
    </button>
  )
}

export default Button
