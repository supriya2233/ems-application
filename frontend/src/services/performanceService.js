const API_URL = 'http://localhost:5000/api/performance'

export const getPerformanceRecords = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch performance records')
  }

  const result = await response.json()

  return result.data
}

export const getPerformanceById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch performance record',
    )
  }

  return result.data
}

export const createPerformance = async (record) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to create performance record',
    )
  }

  return result.data
}

export const updatePerformance = async (id, record) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to update performance record',
    )
  }

  return result.data
}

export const deletePerformance = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to delete performance record',
    )
  }

  return result
}