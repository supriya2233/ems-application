import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'

/*
 * Domain events: "something happened" messages inside the server.
 *
 * A controller only announces what happened, e.g.
 *   publish({ type: 'leave.approved', ... })
 * and doesn't care who is listening. Separate listeners then
 *   - write the activity log
 *   - create notifications
 *   - push the event to every open browser tab (live updates)
 * Adding a new reaction later means adding a listener, not
 * editing every controller. This is event-driven design.
 */

export const bus = new EventEmitter()

// Remembers which browser tab made the current request (sent in
// the X-Client-Id header), so that tab can skip its own toasts.
// AsyncLocalStorage keeps the value for the whole request, even
// across awaits, without passing it through every function.
export const requestContext = new AsyncLocalStorage()

export function clientContext(req, res, next) {
  requestContext.run({ clientId: req.get('X-Client-Id') || null }, next)
}

/* Announce an event. Listeners run after the response is on its way. */
export function publish(event) {
  if (!event) return null

  const full = {
    id: randomUUID(),
    at: new Date().toISOString(),
    actor: 'Administrator', // no login in this app (see README)
    clientId: requestContext.getStore()?.clientId ?? null,
    ...event,
  }

  bus.emit('domain-event', full)

  return full
}

/*
 * Register an async listener. A failing listener is logged but
 * never breaks the request that triggered the event.
 */
export function onEvent(name, handler) {
  bus.on('domain-event', (event) => {
    Promise.resolve()
      .then(() => handler(event))
      .catch((error) => console.error(`[events] ${name} listener failed:`, error.message))
  })
}
