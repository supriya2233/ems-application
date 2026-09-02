const API_URL = 'http://localhost:5000/api/payroll'

export const getPayroll = async (params = {}) => {
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
        'Failed to fetch payroll',
    )
  }

  return result.data
}


export const getPayrollSummary = async (
  month,
) => {
  const query = new URLSearchParams()

  if (month) {
    query.append('month', month)
  }

  const url = query.toString()
    ? `${API_URL}/summary?${query.toString()}`
    : `${API_URL}/summary`

  const response = await fetch(url)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to fetch payroll summary',
    )
  }

  return result.data
}


export const createPayroll = async (
  payroll,
) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':
        'application/json',
    },
    body: JSON.stringify(payroll),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to create payroll',
    )
  }

  return result.data
}


export const updatePayroll = async (
  id,
  payroll,
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(payroll),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message ||
        'Failed to update payroll',
    )
  }

  return result.data
}


export const deletePayroll = async (
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
        'Failed to delete payroll',
    )
  }

  return result
}