function Badge({
  children,
  variant,
}) {
  const status = variant || String(children)
    .toLowerCase()
    .replaceAll(' ', '-')

  return (
    <span className={`ui-badge ui-badge-${status}`}>
      {children}
    </span>
  )
}

export default Badge