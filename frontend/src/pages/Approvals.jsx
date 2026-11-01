import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, Inbox } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import LeaveBalances from '../components/leave/LeaveBalances'
import { useLeaveActions } from '../components/leave/useLeaveActions'
import { useToast } from '../components/common/feedbackContext'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import OnboardingStepApproval from '../components/onboarding/OnboardingStepApproval'
import DocumentApproval from '../components/documents/DocumentApproval'
import { getApprovals } from '../services/approvalService'
import { updateDocument } from '../services/documentService'
import { setOnboardingStep } from '../services/onboardingService'
import { getAvatarColor, getInitials } from '../utils/avatar'
import { formatRange, plural } from '../utils/leave'
import { timeAgo } from '../utils/timeAgo'

/*
 * One inbox for everything waiting for a decision.
 *   leave            pending leave requests (approve / reject)
 *   onboarding-step  overdue onboarding checklist steps (mark done)
 *   document-expiry  expired / expiring documents (renew)
 *   document-verify  documents waiting for verification (verify)
 */
function Approvals() {
  const { approve, reject } = useLeaveActions()
  const toast = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Another tab approving or adding a request updates this list.
  const refreshKey = useLiveRefresh(['leave', 'settings', 'onboarding', 'documents'])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    getApprovals()
      .then((data) => {
        if (!ignore) {
          setItems(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || 'Failed to load approvals')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [refreshKey, reloadKey])

  const decide = async (item, action) => {
    setBusyId(item.id)
    const updated = await action(item.leave)
    setBusyId(null)

    if (updated) {
      // Remove it now; reload so the other cards' balances and
      // team warnings reflect the decision.
      setItems((current) => current.filter((other) => other.id !== item.id))
      setReloadKey((key) => key + 1)
    }
  }

  const verifyDocument = async (item) => {
    setBusyId(item.id)
    try {
      await updateDocument(item.document._id, { status: 'Active' })
      toast.success(`“${item.document.documentName}” verified`)
      setItems((current) => current.filter((other) => other.id !== item.id))
    } catch (err) {
      toast.error(err.message || 'Could not verify the document')
    } finally {
      setBusyId(null)
    }
  }

  const markStepDone = async (item) => {
    setBusyId(item.id)
    try {
      await setOnboardingStep(item.onboarding._id, item.step.key, { done: true })
      toast.success(`${item.step.label} ticked off for ${item.onboarding.employeeName}`)
      setItems((current) => current.filter((other) => other.id !== item.id))
    } catch (err) {
      toast.error(err.message || 'Could not update the step')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="approvals-page">
      <PageHeader
        title="Approvals"
        description={
          loading
            ? 'Everything waiting for your decision'
            : items.length === 0
              ? 'Everything waiting for your decision · all clear'
              : `${plural(items.length, 'item')} waiting for you, oldest first`
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      {loading ? (
        <p className="ui-loading">Loading approvals…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} aria-hidden="true" />}
          title="You’re all caught up"
          description="Leave requests, overdue onboarding steps and documents to renew or verify appear here as soon as they need you."
          action={<Link to="/leave" className="ui-button ui-button-secondary">Go to Leave Management</Link>}
        />
      ) : (
        <ul className="approval-list">
          {items.map((item) => {
            if (item.kind === 'document-expiry' || item.kind === 'document-verify') {
              return (
                <DocumentApproval
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onVerify={verifyDocument}
                />
              )
            }

            if (item.kind === 'onboarding-step') {
              return (
                <OnboardingStepApproval
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onDone={markStepDone}
                />
              )
            }

            const { leave, balance, warnings } = item
            const busy = busyId === item.id

            return (
              <li key={item.id} className="approval-card">
                <div className="approval-main">
                  <span
                    className="approval-avatar"
                    style={{ background: getAvatarColor(leave.employee) }}
                    aria-hidden="true"
                  >
                    {getInitials(leave.employee)}
                  </span>

                  <div className="approval-text">
                    <div className="approval-title">
                      <h2>
                        <Link to={`/employees/${leave.employeeId}`}>{leave.employee}</Link>
                        {' '}· {leave.type} leave
                      </h2>
                      <Badge variant="neutral">Leave request</Badge>
                    </div>

                    <p className="approval-meta">
                      <strong>{formatRange(leave.from, leave.to)}</strong>
                      {' · '}
                      {plural(leave.days, 'working day')} · {leave.department} · asked {timeAgo(item.requestedAt)}
                    </p>

                    <p className="approval-reason">“{leave.reason}”</p>

                    {warnings.map((warning) => (
                      <p key={warning} className="ui-alert ui-alert-warning leave-warning">
                        <CircleAlert size={16} aria-hidden="true" />
                        <span>{warning}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="approval-side">
                  {balance && (
                    <div className="approval-balance">
                      <span className="approval-balance-label">{leave.type} balance</span>
                      <LeaveBalances balances={[balance]} compact />
                      {balance.remaining !== null && (
                        <span className="approval-balance-after">
                          After approval: {balance.remaining - leave.days} left
                        </span>
                      )}
                    </div>
                  )}

                  <div className="approval-actions">
                    <Button
                      variant="secondary"
                      onClick={() => decide(item, reject)}
                      disabled={busy}
                      aria-label={`Reject ${leave.employee}’s leave`}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => decide(item, approve)}
                      loading={busy}
                      disabled={busy}
                      aria-label={`Approve ${leave.employee}’s leave`}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Approvals
