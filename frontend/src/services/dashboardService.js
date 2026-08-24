const API_URL = 'http://localhost:5000/api/dashboard'

export const getDashboard = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  const result = await response.json()

  return result.data
}