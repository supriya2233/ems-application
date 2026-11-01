/*
 * Expiry helpers for the document screens. Same rule as the server
 * (backend/src/services/documentRules.js): a reminder 30 days ahead.
 */
import { todayKey } from './leave'

export const EXPIRY_WARNING_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/* { state: 'none' | 'valid' | 'expiring' | 'expired', daysLeft, text } */
export function expiryInfo(expiryDate, today = todayKey()) {
  if (!expiryDate) return { state: 'none', daysLeft: null, text: '' }

  const expiry = String(new Date(expiryDate).toISOString()).slice(0, 10)
  const daysLeft = Math.round((new Date(`${expiry}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / DAY_MS)

  if (daysLeft < 0) {
    const ago = -daysLeft
    return { state: 'expired', daysLeft, text: `Expired ${ago === 1 ? 'yesterday' : `${ago} days ago`}` }
  }
  if (daysLeft <= EXPIRY_WARNING_DAYS) {
    return {
      state: 'expiring',
      daysLeft,
      text: daysLeft === 0 ? 'Expires today' : daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${daysLeft} days`,
    }
  }
  return { state: 'valid', daysLeft, text: '' }
}
