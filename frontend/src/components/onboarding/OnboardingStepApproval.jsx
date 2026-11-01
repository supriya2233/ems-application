import { Link } from 'react-router-dom'
import { ListChecks } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatDay } from '../../utils/leave'

/*
 * Approvals inbox card for an overdue onboarding step.
 * Most steps can be ticked right here. Equipment needs an asset
 * picked, so it links to the person's card on the Onboarding page.
 */
function OnboardingStepApproval({ item, busy, onDone }) {
  const { onboarding, step } = item
  const openLink = `/onboarding?focus=${onboarding._id}`

  return (
    <li className="approval-card">
      <div className="approval-main">
        <span className="approval-avatar approval-avatar-icon" aria-hidden="true">
          <ListChecks size={20} />
        </span>

        <div className="approval-text">
          <div className="approval-title">
            <h2>
              <Link to={`/employees/${onboarding.employeeId}`}>{onboarding.employeeName}</Link>
              {' '}· {step.label}
            </h2>
            <Badge variant="danger">Overdue step</Badge>
          </div>

          <p className="approval-meta">
            <strong>Was due {formatDay(step.dueDate)}</strong>
            {' · '}
            {onboarding.department} · joins {formatDay(onboarding.joiningDate)}
          </p>
        </div>
      </div>

      <div className="approval-side">
        <div className="approval-actions">
          {step.key === 'equipment' ? (
            <Link to={openLink} className="ui-button ui-button-primary">
              Hand over equipment
            </Link>
          ) : (
            <>
              <Link to={openLink} className="ui-button ui-button-secondary">
                Open checklist
              </Link>
              <Button
                onClick={() => onDone(item)}
                loading={busy}
                aria-label={`Mark “${step.label}” done for ${onboarding.employeeName}`}
              >
                Mark done
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

export default OnboardingStepApproval
