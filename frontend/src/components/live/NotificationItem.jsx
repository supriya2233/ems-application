import { Link } from 'react-router-dom'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'

import { timeAgo } from '../../utils/timeAgo'

const TONE_ICONS = {
  success: CircleCheck,
  warning: CircleAlert,
  info: Info,
}

/*
 * One notification row, used by the header bell and the
 * Notifications page. Clicking it opens the related page and
 * marks it as read.
 */
function NotificationItem({ notification, onOpen }) {
  const Icon = TONE_ICONS[notification.tone] || Info
  const content = (
    <>
      <span className={`notif-icon notif-icon-${notification.tone}`} aria-hidden="true">
        <Icon size={16} />
      </span>

      <span className="notif-text">
        <strong>{notification.title}</strong>
        <span>{notification.message}</span>
        <time dateTime={notification.createdAt}>{timeAgo(notification.createdAt)}</time>
      </span>

      {!notification.read && (
        <span className="notif-dot">
          <span className="visually-hidden">Unread</span>
        </span>
      )}
    </>
  )

  return (
    <li className={`notif-item ${notification.read ? '' : 'notif-item-unread'}`}>
      {notification.link ? (
        <Link to={notification.link} className="notif-body" onClick={() => onOpen?.(notification)}>
          {content}
        </Link>
      ) : (
        <button type="button" className="notif-body" onClick={() => onOpen?.(notification)}>
          {content}
        </button>
      )}
    </li>
  )
}

export default NotificationItem
