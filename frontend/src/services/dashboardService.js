import { API_BASE } from './apiClient'

const API_URL = `${API_BASE}/dashboard`

export const getDashboard = async () => {
  const response = await fetch(API_URL)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch dashboard data'
    )
  }

  return result.data
}