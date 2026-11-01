/*
 * Avatar helpers: initials and a stable colour per person.
 *
 * Colours come from docs/design-system.md (§2). Only the ones
 * that keep white initials readable (WCAG AA, 4.5:1) are used:
 * teal, orange and sky blue are too light for white text.
 */
const AVATAR_COLORS = [
  'var(--color-primary)',          // #0075DE
  'var(--color-accent-purple)',    // #9849E8
  'var(--color-accent-dark-blue)', // #005BAB
  'var(--color-accent-deep-blue)', // #1313BA
  'var(--color-near-black)',       // #31302E
]

/* "Priya Sharma" → "PS", "Rahul" → "R" */
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts.at(-1).charAt(0) : ''

  return `${first}${last}`.toUpperCase()
}

/*
 * The same name always gets the same colour, so a person is
 * recognisable across pages and reloads.
 */
export function getAvatarColor(name = '') {
  let hash = 0

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000003
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
