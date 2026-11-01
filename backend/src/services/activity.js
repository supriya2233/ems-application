import { describeChange } from './describe.js'
import { publish } from './events.js'

const plain = (doc) =>
  doc && typeof doc.toObject === 'function' ? doc.toObject() : doc

/*
 * The one line controllers call after a successful save:
 *   publishChange('leave', 'updated', before, leave)
 *
 * The save already worked, so a problem describing it must never
 * turn into an error for the user. It is logged instead.
 */
export function publishChange(module, action, before, after) {
  try {
    return publish(describeChange(module, action, plain(before), plain(after)))
  } catch (error) {
    console.error(`[events] could not describe ${module}.${action}:`, error.message)
    return null
  }
}
