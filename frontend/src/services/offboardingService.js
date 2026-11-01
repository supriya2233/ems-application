import { apiRequest } from './apiClient'

export const getOffboardings = async () => (await apiRequest('/offboarding')).data

export const getOffboarding = async (id) => (await apiRequest(`/offboarding/${id}`)).data

/* { employeeId, lastWorkingDay, reason, notes } → the new record with its checklist */
export const startOffboarding = async (details) =>
  (await apiRequest('/offboarding', { method: 'POST', body: details })).data

/* Last working day, reason and notes */
export const updateOffboarding = async (id, details) =>
  (await apiRequest(`/offboarding/${id}`, { method: 'PUT', body: details })).data

/* Tick one checklist item. Asset items take a return condition. */
export const setOffboardingItem = async (id, key, { done = true, condition, note } = {}) =>
  (await apiRequest(`/offboarding/${id}/items/${encodeURIComponent(key)}`, { method: 'PATCH', body: { done, condition, note } })).data

export const deleteOffboarding = async (id) => apiRequest(`/offboarding/${id}`, { method: 'DELETE' })
