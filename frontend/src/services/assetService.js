const API_URL = 'http://localhost:5000/api/assets'

export const getAssets = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch assets')
  }

  const result = await response.json()

  return result.data
}

export const getAssetById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch asset')
  }

  const result = await response.json()

  return result.data
}

export const createAsset = async (asset) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create asset')
  }

  const result = await response.json()

  return result.data
}

export const updateAsset = async (id, asset) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update asset')
  }

  const result = await response.json()

  return result.data
}

export const deleteAsset = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete asset')
  }

  return response.json()
}