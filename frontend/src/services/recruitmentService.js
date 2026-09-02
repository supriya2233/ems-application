const API_URL =
  'http://localhost:5000/api/recruitment'

export const getRecruitments = async (
  params = {},
) => {
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
        'Failed to fetch recruitment records',
    )
  }

  return result.data
}


export const getRecruitment = async (
  id,
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to fetch recruitment record',
    )
  }

  return result.data
}


export const createRecruitment = async (
  candidate,
) => {
  const response = await fetch(
    API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(candidate),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to create recruitment candidate',
    )
  }

  return result.data
}


export const updateRecruitment = async (
  id,
  candidate,
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(candidate),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to update recruitment record',
    )
  }

  return result.data
}


export const deleteRecruitment = async (
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
        'Failed to delete recruitment record',
    )
  }

  return result
}