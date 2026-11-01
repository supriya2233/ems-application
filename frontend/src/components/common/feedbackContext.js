import { createContext, useContext } from 'react'

/*
 * Shared "feedback" tools for every page:
 *   const toast = useToast()     toast.success('Saved')
 *   const confirm = useConfirm() if (await confirm({...})) …
 *
 * The values come from <FeedbackProvider>, which wraps the app
 * in App.jsx.
 */
export const FeedbackContext = createContext(null)

function useFeedback() {
  const value = useContext(FeedbackContext)

  if (!value) {
    throw new Error('useToast/useConfirm must be used inside <FeedbackProvider>')
  }

  return value
}

export function useToast() {
  return useFeedback().toast
}

export function useConfirm() {
  return useFeedback().confirm
}
