/*
 * Plain container. variant="accent" gives the light-blue
 * card from the design system (for tips and highlights).
 */
function Card({
  children,
  className = '',
  variant,
}) {
  const classes = [
    'ui-card',
    variant === 'accent' && 'ui-card-accent',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      {children}
    </section>
  )
}

export default Card
