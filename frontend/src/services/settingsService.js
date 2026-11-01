import { apiRequest } from './apiClient'

// → { leaveAllowances, workingDays, holidays }
export const getSettings = async () => (await apiRequest('/settings')).data

export const updateSettings = async (settings) =>
  (await apiRequest('/settings', { method: 'PUT', body: settings })).data
