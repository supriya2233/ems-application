const API_URL = 'http://localhost:5000/api/leaves'

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