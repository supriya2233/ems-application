import { apiRequest } from './apiClient'

export const getAnnouncements = async () => {
  const result = await apiRequest('/announcements')
  return { items: result.data, categories: result.categories }
}

export const createAnnouncement = async (announcement) =>
  (await apiRequest('/announcements', { method: 'POST', body: announcement })).data

export const updateAnnouncement = async (id, changes) =>
  (await apiRequest(`/announcements/${id}`, { method: 'PUT', body: changes })).data

export const deleteAnnouncement = async (id) =>
  apiRequest(`/announcements/${id}`, { method: 'DELETE' })
