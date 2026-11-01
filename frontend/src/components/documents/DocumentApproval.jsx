import { Link } from 'react-router-dom'
import { FileCheck, FileClock, FileWarning } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatDay } from '../../utils/leave'
import { timeAgo } from '../../utils/timeAgo'

/*
 * Approvals inbox card for a document:
 *   document-expiry  expired or expiring within 30 days → renew it on the Documents page
 *   document-verify  uploaded, waiting for verification → Verify here
 */
function DocumentApproval({ item, busy, onVerify }) {
  const { document } = item
  const verify = item.kind === 'document-verify'
  const expired = item.state === 'expired'
  const Icon = verify ? FileCheck : expired ? FileWarning : FileClock
  const openLink = `/documents?focus=${document._id}`

  const when = verify
    ? `added ${timeAgo(item.requestedAt)}`
    : expired
      ? `expired ${formatDay(document.expiryDate)}`
      : item.daysLeft === 0
        ? 'expires today'
        : `expires ${formatDay(document.expiryDate)} (in ${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'})`

  return (
    <li className="approval-card">
      <div className="approval-main">
        <span
          className={`approval-avatar approval-avatar-icon ${expired ? 'approval-avatar-danger' : ''}`}
          aria-hidden="true"
        >
          <Icon size={20} />
        </span>

        <div className="approval-text">
          <div className="approval-title">
            <h2>
              <Link to={`/employees/${document.employeeId}`}>{document.employeeName}</Link>
              {' '}· {document.documentName}
            </h2>
            {verify ? (
              <Badge variant="warning">To verify</Badge>
            ) : (
              <Badge variant={expired ? 'danger' : 'warning'}>{expired ? 'Expired' : 'Expiring soon'}</Badge>
            )}
          </div>

          <p className="approval-meta">
            <strong>{document.documentType}</strong>
            {' · '}
            {when}
          </p>
        </div>
      </div>

      <div className="approval-side">
        <div className="approval-actions">
          {verify ? (
            <>
              <Link to={openLink} className="ui-button ui-button-secondary">Open document</Link>
              <Button
                onClick={() => onVerify(item)}
                loading={busy}
                aria-label={`Verify “${document.documentName}” for ${document.employeeName}`}
              >
                Verify
              </Button>
            </>
          ) : (
            <Link to={openLink} className="ui-button ui-button-primary">
              Renew document
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}

export default DocumentApproval
