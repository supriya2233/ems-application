import { TONES, getStatusTone } from '../../utils/statusTone'

/*
 * Status pill with a coloured dot.
 *
 *   <Badge>Approved</Badge>              → tone looked up from the text
 *   <Badge variant="warning">…</Badge>   → explicit tone
 *   <Badge variant="present">…</Badge>   → older status-name variants still work
 */
function Badge({
  children,
  variant,
  className = '',
}) {
  let tone

  if (TONES.includes(variant)) {
    tone = variant
  } else if (variant) {
    tone = getStatusTone(String(variant).replaceAll('-', ' '))
  } else {
    tone = getStatusTone(children)
  }

  return (
    <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>
      {children}
    </span>
  )
}

export default Badge
