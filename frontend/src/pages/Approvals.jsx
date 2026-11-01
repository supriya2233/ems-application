import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, Inbox } from 'lucide-react'

import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import LeaveBalances from '../components/leave/LeaveBalances'
import { useLeaveActions } from '../components/leave/useLeaveActions'
import { useLiveRefresh } from '../components/live/liveEventsContext'
import { getApprovals } from '../services/approvalService'
import { getAvatarColor, getInitials } from '../utils/avatar'
import { formatRange, plural } from '../utils/leave'
import { timeAgo } from '../utils/timeAgo'

/*
 * One inbox for everything waiting for a decision.
 * Today: leave requests. Later phases add onboarding steps and
 * expiring documents as new `kind`s.
 */
function Approvals() {
  const { approve, reject } = useLeaveActions()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Another tab approving or adding a request updates this list.
  const refreshKey = useLiveRefresh(['leave', 'settings'])
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

  return (
    <div className="approvals-page">
      <PageHeader
        title="Approvals"
        description={
          loading
            ? 'Everything waiting for your decision'
            : items.length === 0
              ? 'Everything waiting for your decision · all clear'
              : `${plural(items.length, 'request')} waiting for your decision, oldest first`
        }
      />

      {error && <div className="ui-alert ui-alert-error" role="alert">{error}</div>}

      {loading ? (
        <p className="ui-loading">Loading approvals…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} aria-hidden="true" />}
          title="You’re all caught up"
          description="New leave requests will appear here as soon as they are made."
          action={<Link to="/leave" className="ui-button ui-button-secondary">Go to Leave Management</Link>}
        />
      ) : (
        <ul className="approval-list">
          {items.map((item) => {
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
