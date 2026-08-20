const API_URL = 'http://localhost:5000/api/departments'

export const getDepartments = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch departments')
  }

  const result = await response.json()

  return result.data
}

export const createDepartment = async (department) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(department),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to create department',
    )
  }

  return result.data
}