import { apiRequest, API_BASE } from './apiClient'

const API_URL = `${API_BASE}/leaves`

export const getLeaves = async () => {
  const response = await fetch(API_URL)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to fetch leave requests',
    )
  }

  return result.data
}

export const createLeave = async (leave) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(leave),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to submit leave request',
    )
  }

  return result.data
}

export const updateLeave = async (
  id,
  leave,
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leave),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to update leave request',
    )
  }

  return result.data
}

export const deleteLeave = async (id) => {
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
        'Failed to delete leave request',
    )
  }

  return result
}

// Working days, balance and warnings for a request being filled in.
// Nothing is saved. → { days, balance, warnings, error }
export const previewLeave = async (request) =>
  (await apiRequest('/leaves/preview', { method: 'POST', body: request })).data

// → [{ type, allowance, used, pending, remaining }]
export const getLeaveBalances = async (employeeId, year = new Date().getFullYear()) =>
  (await apiRequest(`/leaves/balances/${encodeURIComponent(employeeId)}?year=${year}`)).data

// → { teamSize, othersOff, message }
export const getLeaveCoverage = async (id) =>
  (await apiRequest(`/leaves/${id}/coverage`)).data
