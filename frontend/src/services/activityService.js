import { apiRequest } from './apiClient'

export const getActivity = async ({ limit = 20, module, employeeId } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (module) params.set('module', module)
  if (employeeId) params.set('employeeId', employeeId)

  const result = await apiRequest(`/activity?${params}`)
  return result.data
}
