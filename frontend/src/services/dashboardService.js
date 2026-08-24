const API_URL = 'http://localhost:5000/api/dashboard'

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