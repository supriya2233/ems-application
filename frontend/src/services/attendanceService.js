const API_URL = 'http://localhost:5000/api/attendance'

export const getAttendance = async () => {
  const response = await fetch(API_URL)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch attendance',
    )
  }

  return result.data
}

export const createAttendance = async (attendance) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attendance),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to mark attendance',
    )
  }

  return result.data
}

export const updateAttendance = async (
  id,
  attendance,
) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attendance),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to update attendance',
    )
  }

  return result.data
}

export const deleteAttendance = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to delete attendance',
    )
  }

  return result
}