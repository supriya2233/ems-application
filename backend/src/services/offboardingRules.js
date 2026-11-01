/*
 * Offboarding checklist rules as pure functions (tested in
 * test/offboarding.test.js).
 */

export const OFFBOARDING_REASONS = ['Resignation', 'Termination', 'Retirement', 'End of contract', 'Other']

// Every offboarding has these, after one "return" item per asset.
export const STANDARD_ITEMS = [
  { key: 'exit-interview', label: 'Exit interview', kind: 'task' },
  { key: 'handover', label: 'Knowledge handover', kind: 'task' },
  { key: 'archive-documents', label: 'Archive documents', kind: 'task' },
  { key: 'final-settlement', label: 'Final settlement', kind: 'settlement' },
]

export const assetItemKey = (asset) => `asset-${asset.assetId || asset._id}`

/* The checklist for someone who holds these assets. */
export function buildChecklist(assets = []) {
  return [
    ...assets.map((asset) => ({
      key: assetItemKey(asset),
      label: `Return ${asset.assetName} (${asset.assetId})`,
      kind: 'asset',
      assetId: String(asset._id),
      done: false,
    })),
    ...STANDARD_ITEMS.map((item) => ({ ...item, assetId: '', done: false })),
  ]
}

/*
 * Assets handed to the person after offboarding started get an
 * item too. Existing items (and their ticks) are kept.
 */
export function withAssetItems(items, assets) {
  const known = new Set(items.map((item) => item.key))
  const extra = buildChecklist(assets).filter((item) => item.kind === 'asset' && !known.has(item.key))
  if (extra.length === 0) return items

  const firstStandard = items.findIndex((item) => item.kind !== 'asset')
  const at = firstStandard === -1 ? items.length : firstStandard
  return [...items.slice(0, at), ...extra, ...items.slice(at)]
}

/* Status always follows the checklist. */
export function deriveOffboardingStatus(items = []) {
  const done = items.filter((item) => item.done).length
  if (done === 0) return 'Not Started'
  if (done === items.length) return 'Completed'
  return 'In Progress'
}
