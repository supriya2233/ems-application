import { apiRequest } from './apiClient'

/* Analytics: everything the Analytics page shows for the last N months. */
export const getAnalytics = async (months = 12) =>
  (await apiRequest(`/analytics?months=${months}`)).data

/* Reports: the list of reports (with their filters), and one report. */
export const getReportCatalog = async () => (await apiRequest('/reports')).data

export const runReport = async (id, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  )
  const suffix = query.toString() ? `?${query}` : ''
  return (await apiRequest(`/reports/${encodeURIComponent(id)}${suffix}`)).data
}
