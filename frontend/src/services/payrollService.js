import { apiRequest, API_BASE } from './apiClient'

const API_URL = `${API_BASE}/payroll`

export const getPayroll = async (params = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'All'
      ) {
        query.append(key, value)
      }
    },
  )

  const url = query.toString()
    ? `${API_URL}?${query.toString()}`
    : API_URL

  const response = await fetch(url)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to fetch payroll',
    )
  }

  return result.data
}


export const getPayrollSummary = async (
  month,
) => {
  const query = new URLSearchParams()

  if (month) {
    query.append('month', month)
  }

  const url = query.toString()
    ? `${API_URL}/summary?${query.toString()}`
    : `${API_URL}/summary`

  const response = await fetch(url)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to fetch payroll summary',
    )
  }

  return result.data
}


export const createPayroll = async (
  payroll,
) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':
        'application/json',
    },
    body: JSON.stringify(payroll),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to create payroll',
    )
  }

  return result.data
}


export const updatePayroll = async (
  id,
  payroll,
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(payroll),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to update payroll',
    )
  }

  return result.data
}


export const deletePayroll = async (
  id,
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: 'DELETE',
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to delete payroll',
    )
  }

  return result
}
/* Months for the picker, newest first (worked out by the server). */
export const getPayrollMonths = async () => (await apiRequest('/payroll/months')).data

/*
 * The whole month's calculation, nothing saved:
 * { month, workingDays, rows: [{ employeeId, state, net, breakdown, … }], totals }
 * salaries: { EMP002: { basic, allowances } } for people with no earlier payroll
 */
export const previewPayroll = async (month, salaries = {}) =>
  (await apiRequest('/payroll/generate', { method: 'POST', body: { month, preview: true, salaries } })).data

/* Creates Draft records for everyone who is ready → { created, … } */
export const generatePayroll = async (month, salaries = {}) =>
  (await apiRequest('/payroll/generate', { method: 'POST', body: { month, salaries } })).data

/* Re-reads leave and attendance for one (not yet processed) record. */
export const recalculatePayroll = async (id) =>
  (await apiRequest(`/payroll/${id}/recalculate`, { method: 'POST' })).data
