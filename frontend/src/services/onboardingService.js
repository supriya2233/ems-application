const API_URL = 'http://localhost:5000/api/onboarding'

export const getOnboardingRecords = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch onboarding records')
  }

  const result = await response.json()

  return result.data
}

export const getOnboardingById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch onboarding record',
    )
  }

  return result.data
}

export const createOnboarding = async (record) => {
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
      result.message || 'Failed to create onboarding record',
    )
  }

  return result.data
}

export const updateOnboarding = async (id, record) => {
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
      result.message || 'Failed to update onboarding record',
    )
  }

  return result.data
}

export const deleteOnboarding = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to delete onboarding record',
    )
  }

  return result
}