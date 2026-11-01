import { useCallback } from 'react'

import { useConfirm, useToast } from '../common/feedbackContext'
import { getLeaveCoverage, updateLeave } from '../../services/leaveService'
import { plural } from '../../utils/leave'

/*
 * Approve / reject / cancel, shared by the Leave page and the
 * Approvals inbox. Each returns the updated leave, or null when
 * the user backed out or the request failed (a toast explains).
 *
 * Approving first checks who else in the team is off; if anyone
 * is, the user is asked to confirm.
 */
export function useLeaveActions() {
  const confirm = useConfirm()
  const toast = useToast()

  const setStatus = useCallback(
    async (leave, status, successMessage) => {
      try {
        const updated = await updateLeave(leave._id, { status })
        toast.success(successMessage)
        return updated
      } catch (error) {
        toast.error(error.message || 'Could not update the leave request')
        return null
      }
    },
    [toast],
  )

  const approve = useCallback(
    async (leave) => {
      try {
        const coverage = await getLeaveCoverage(leave._id)

        if (coverage.message) {
          const ok = await confirm({
            title: 'Approve anyway?',
            message: coverage.message,
            confirmLabel: 'Approve',
          })
          if (!ok) return null
        }
      } catch {
        // If the check fails, still let the user approve.
      }

      return setStatus(
        leave,
        'Approved',
        `Approved ${leave.employee}’s ${plural(leave.days, 'day')} of ${leave.type} leave`,
      )
    },
    [confirm, setStatus],
  )

  const reject = useCallback(
    async (leave) => {
      const ok = await confirm({
        title: 'Reject this request?',
        message: `${leave.employee} asked for ${plural(leave.days, 'day')} of ${leave.type} leave.`,
        confirmLabel: 'Reject',
        tone: 'danger',
      })
      if (!ok) return null

      return setStatus(leave, 'Rejected', `Rejected ${leave.employee}’s leave request`)
    },
    [confirm, setStatus],
  )

  const cancel = useCallback(
    async (leave) => {
      const ok = await confirm({
        title: 'Cancel this approved leave?',
        message: `The days go back to ${leave.employee}’s balance and the attendance entries are removed.`,
        confirmLabel: 'Cancel leave',
        cancelLabel: 'Keep it',
        tone: 'danger',
      })
      if (!ok) return null

      return setStatus(leave, 'Cancelled', `Cancelled ${leave.employee}’s leave`)
    },
    [confirm, setStatus],
  )

  return { approve, reject, cancel }
}
