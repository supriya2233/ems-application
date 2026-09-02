const API_URL = 'http://localhost:5000/api/documents'

export const getDocuments = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch documents')
  }

  const result = await response.json()

  return result.data
}

export const getDocumentById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`)

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to fetch document',
    )
  }

  return result.data
}

export const createDocument = async (document) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to create document',
    )
  }

  return result.data
}

export const updateDocument = async (id, document) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to update document',
    )
  }

  return result.data
}

export const deleteDocument = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Failed to delete document',
    )
  }

  return result
}