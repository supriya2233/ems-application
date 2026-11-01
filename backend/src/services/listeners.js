import ActivityLog from '../models/ActivityLog.js'
import Notification from '../models/Notification.js'
import { onEvent } from './events.js'
import { broadcast } from './liveStream.js'

/*
 * Reactions to domain events. Registered once at startup.
 */
export function registerListeners() {
  // 1. Every event becomes a line in the activity log, then is
  //    pushed to open browser tabs.
  onEvent('activity', async (event) => {
    await ActivityLog.create({
      eventId: event.id,
      type: event.type,
      module: event.module,
      action: event.action,
      summary: event.summary,
      actor: event.actor,
      employeeId: event.employeeId,
      entityId: event.entityId,
      link: event.link,
      at: event.at,
    })

    const { notify, ...publicEvent } = event
    broadcast('activity', publicEvent)
  })

  // 2. Events marked `notify` also become notifications.
  onEvent('notifications', async (event) => {
    if (!event.notify) return

    const notification = await Notification.create({
      eventId: event.id,
      type: event.type,
      title: event.notify.title,
      message: event.notify.message,
      tone: event.notify.tone,
      link: event.link,
    })

    broadcast('notification', {
      ...notification.toObject(),
      clientId: event.clientId, // lets the tab that did it skip the toast
    })
  })
}
