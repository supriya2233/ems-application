const API_URL = 'http://localhost:5000/api/tasks'

export const getTasks = async () => {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  const result = await response.json()

  return result.data
}

export const createTask = async (task) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to create task')
  }

  return result.data
}

export const updateTask = async (id, task) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update task')
  }

  return result.data
}

export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete task')
  }

  return result
}