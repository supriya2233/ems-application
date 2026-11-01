import { apiRequest } from './apiClient'

// → { data: [...], unreadCount }
export const getNotifications = ({ unread = false, limit = 50 } = {}) =>
  apiRequest(`/notifications?limit=${limit}${unread ? '&unread=true' : ''}`)

export const markNotificationRead = (id) =>
  apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiRequest('/notifications/read-all', { method: 'PATCH' })
