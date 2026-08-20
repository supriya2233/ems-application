const API_URL = 'http://localhost:5000/api/employees'

export const getEmployees = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }

  const result = await response.json()

  return result.data
}

export const createEmployee = async (employee) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to create employee')
  }

  return result.data
}

export const updateEmployee = async (id, employee) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update employee')
  }

  return result.data
}

export const deleteEmployee = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete employee')
  }

  return result
}