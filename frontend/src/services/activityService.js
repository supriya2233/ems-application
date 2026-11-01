import { apiRequest } from './apiClient'

/* Newest entries as a plain list (dashboard feed, profile timeline). */
export const getActivity = async ({ limit = 20, module, employeeId } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (module) params.set('module', module)
  if (employeeId) params.set('employeeId', employeeId)

  const result = await apiRequest(`/activity?${params}`)
  return result.data
}

/*
 * One page of the activity log.
 *   filters  { module, employeeId, from, to, q }  (from/to are ISO times)
 *   before   cursor from the previous page, for "Load older"
 * → { items, hasMore, nextCursor }
 */
export const getActivityPage = async (filters = {}, { before, limit = 30 } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) })
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  if (before) params.set('before', before)

  const result = await apiRequest(`/activity?${params}`)
  return { items: result.data, hasMore: result.hasMore, nextCursor: result.nextCursor }
}

/* Modules that have history: [{ module, count }] */
export const getActivityModules = async () => {
  const result = await apiRequest('/activity/modules')
  return result.data
}
