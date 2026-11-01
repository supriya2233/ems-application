import { apiRequest } from './apiClient'

// → [{ kind: 'leave', id, leave, balance, coverage, warnings }]
export const getApprovals = async () => (await apiRequest('/approvals')).data
