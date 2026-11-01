import { describeChange } from './describe.js'
import { publish } from './events.js'

const plain = (doc) =>
  doc && typeof doc.toObject === 'function' ? doc.toObject() : doc

/*
 * The one line controllers call after a successful save:
 *   publishChange('leave', 'updated', before, leave)
 *
 * Options:
 *   actor: 'System'   for changes the server makes by itself
 *   notify: false     activity log only, even if this kind of change
 *                     normally sends a notification (used when a
 *                     bigger action sends one combined notification)
 *
 * The save already worked, so a problem describing it must never
 * turn into an error for the user. It is logged instead.
 */
export function publishChange(module, action, before, after, { actor, notify } = {}) {
  try {
    const event = describeChange(module, action, plain(before), plain(after))
    if (actor) event.actor = actor
    if (notify === false) event.notify = null
    return publish(event)
  } catch (error) {
    console.error(`[events] could not describe ${module}.${action}:`, error.message)
    return null
  }
}
