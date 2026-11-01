/*
 * Turns a change to a record into a domain event.
 *
 *   describeChange('leave', 'updated', before, after)
 *   → { type: 'leave.approved', summary: 'Approved Priya Sharma’s …',
 *       notify: { title, message, tone } }
 *
 * Pure functions only (no database), so they are easy to test.
 * `notify` is set only for changes a person should act on or
 * know about; everything else is just written to the activity log.
 */

const plural = (count, word) => `${count} ${word}${Number(count) === 1 ? '' : 's'}`

const formatDay = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : ''

const changed = (before, after, field) =>
  Boolean(before && after) && String(before[field] ?? '') !== String(after[field] ?? '')

const employeeLink = (employeeId) => (employeeId ? `/employees/${employeeId}` : '')

/*
 * Per module: how to name a record, where it lives, and which
 * changes are worth an event of their own.
 */
const MODULES = {
  employees: {
    label: (doc) => doc.name,
    link: (doc) => employeeLink(doc.employeeId),
    employeeId: (doc) => doc.employeeId,
    created: (doc) => ({
      summary: `Added ${doc.name} as ${doc.role} in ${doc.department}`,
      notify: { title: 'New employee', message: `${doc.name} joined ${doc.department} as ${doc.role}.`, tone: 'success' },
    }),
    updated: (before, after) => {
      if (changed(before, after, 'status')) {
        return {
          action: 'status-changed',
          summary: `Changed ${after.name}’s status from ${before.status} to ${after.status}`,
        }
      }
      if (changed(before, after, 'department')) {
        return {
          action: 'moved',
          summary: `Moved ${after.name} from ${before.department} to ${after.department}`,
          notify: { title: 'Department change', message: `${after.name} moved to ${after.department}.`, tone: 'info' },
        }
      }
      return null
    },
  },

  departments: {
    label: (doc) => doc.name,
    link: () => '/departments',
    created: (doc) => ({ summary: `Created the ${doc.name} department` }),
    updated: (before, after) =>
      changed(before, after, 'name')
        ? { action: 'renamed', summary: `Renamed the ${before.name} department to ${after.name}` }
        : null,
  },

  tasks: {
    label: (doc) => `“${doc.title}”`,
    link: () => '/tasks',
    employeeId: (doc) => doc.assigneeId,
    created: (doc) => ({
      summary: `Created task “${doc.title}” for ${doc.assignee}`,
      notify: {
        title: 'Task assigned',
        message: `“${doc.title}” was assigned to ${doc.assignee}, due ${formatDay(doc.dueDate)}.`,
        tone: 'info',
      },
    }),
    updated: (before, after) => {
      if (changed(before, after, 'status') && after.status === 'Completed') {
        return {
          action: 'completed',
          summary: `Completed task “${after.title}”`,
          notify: { title: 'Task completed', message: `${after.assignee} completed “${after.title}”.`, tone: 'success' },
        }
      }
      if (changed(before, after, 'assigneeId')) {
        return {
          action: 'reassigned',
          summary: `Reassigned “${after.title}” from ${before.assignee} to ${after.assignee}`,
          notify: { title: 'Task reassigned', message: `“${after.title}” is now assigned to ${after.assignee}.`, tone: 'info' },
        }
      }
      if (changed(before, after, 'status')) {
        return { action: 'status-changed', summary: `Moved “${after.title}” to ${after.status}` }
      }
      return null
    },
  },

  leave: {
    label: (doc) => `${doc.employee}’s ${doc.type} leave`,
    link: () => '/leave',
    employeeId: (doc) => doc.employeeId,
    created: (doc) => {
      const dates = `${formatDay(doc.from)} – ${formatDay(doc.to)}`
      const amount = `${plural(doc.days, 'day')} of ${doc.type} leave`

      // Leave entered as already approved (e.g. recorded afterwards)
      if (doc.status === 'Approved') {
        return {
          action: 'approved',
          summary: `Recorded ${amount} for ${doc.employee} as approved (${dates})`,
          notify: { title: 'Leave approved', message: `${doc.employee}’s ${amount} was recorded as approved.`, tone: 'success' },
        }
      }

      return {
        action: 'requested',
        summary: `${doc.employee} requested ${amount}`,
        notify: {
          title: 'Leave request to review',
          message: `${doc.employee} asked for ${amount} (${dates}).`,
          tone: 'warning',
        },
      }
    },
    updated: (before, after) => {
      if (!changed(before, after, 'status')) return null
      const verb = after.status.toLowerCase()
      return {
        action: verb,
        summary: `${after.status === 'Pending' ? 'Reopened' : after.status} ${after.employee}’s ${after.type} leave (${formatDay(after.from)} – ${formatDay(after.to)})`,
        notify: after.status === 'Pending'
          ? null
          : {
              title: `Leave ${verb}`,
              message: `${after.employee}’s ${plural(after.days, 'day')} of ${after.type} leave was ${verb}.`,
              tone: after.status === 'Approved' ? 'success' : 'info',
            },
      }
    },
  },

  attendance: {
    label: (doc) => `${doc.employeeName}’s attendance on ${formatDay(doc.date)}`,
    link: () => '/attendance',
    employeeId: (doc) => doc.employeeId,
    created: (doc) => ({ summary: `Marked ${doc.employeeName} ${doc.status} on ${formatDay(doc.date)}` }),
  },

  payroll: {
    label: (doc) => `${doc.employeeName}’s ${doc.month} payroll`,
    link: () => '/payroll',
    employeeId: (doc) => doc.employeeId,
    updated: (before, after) =>
      changed(before, after, 'status') && after.status === 'Processed'
        ? {
            action: 'processed',
            summary: `Processed ${after.employeeName}’s ${after.month} payroll`,
            notify: { title: 'Payroll processed', message: `${after.employeeName}’s ${after.month} salary is ready.`, tone: 'success' },
          }
        : null,
  },

  recruitment: {
    label: (doc) => doc.candidateName,
    link: () => '/recruitment',
    created: (doc) => ({
      summary: `Added candidate ${doc.candidateName} for ${doc.position}`,
      notify: { title: 'New candidate', message: `${doc.candidateName} applied for ${doc.position} (${doc.department}).`, tone: 'info' },
    }),
    updated: (before, after) => {
      if (!changed(before, after, 'status')) return null
      const important = ['Selected', 'Hired'].includes(after.status)
      return {
        action: 'stage-changed',
        summary: `Moved ${after.candidateName} from ${before.status} to ${after.status}`,
        notify: important
          ? { title: `Candidate ${after.status.toLowerCase()}`, message: `${after.candidateName} was ${after.status.toLowerCase()} for ${after.position}.`, tone: 'success' }
          : null,
      }
    },
  },

  onboarding: {
    label: (doc) => `${doc.employeeName}’s onboarding`,
    link: () => '/onboarding',
    employeeId: (doc) => doc.employeeId,
    created: (doc) => ({
      action: 'started',
      summary: `Started onboarding for ${doc.employeeName}`,
      notify: { title: 'Onboarding started', message: `${doc.employeeName} (${doc.department}) starts on ${formatDay(doc.joiningDate)}.`, tone: 'info' },
    }),
    updated: (before, after) =>
      changed(before, after, 'status') && after.status === 'Completed'
        ? {
            action: 'completed',
            summary: `Completed onboarding for ${after.employeeName}`,
            // The notification comes from services/onboardingService.js
          }
        : null,
  },

  performance: {
    label: (doc) => `${doc.employeeName}’s ${doc.reviewPeriod} review`,
    link: () => '/performance',
    employeeId: (doc) => doc.employeeId,
    updated: (before, after) =>
      changed(before, after, 'status') && after.status === 'Completed'
        ? {
            action: 'completed',
            summary: `Completed ${after.employeeName}’s ${after.reviewPeriod} review (${after.rating}/5)`,
            notify: { title: 'Review completed', message: `${after.employeeName} was rated ${after.rating}/5 for ${after.reviewPeriod}.`, tone: 'success' },
          }
        : null,
  },

  documents: {
    label: (doc) => `“${doc.documentName}”`,
    link: () => '/documents',
    employeeId: (doc) => doc.employeeId,
    created: (doc) => ({
      summary: `Added ${doc.documentType} “${doc.documentName}” for ${doc.employeeName}`,
      notify: doc.status === 'Pending Verification'
        ? { title: 'Document to verify', message: `“${doc.documentName}” for ${doc.employeeName} needs verification.`, tone: 'warning' }
        : null,
    }),
    updated: (before, after) => {
      if (!changed(before, after, 'status')) return null
      if (before.status === 'Pending Verification' && after.status === 'Active') {
        return { action: 'verified', summary: `Verified “${after.documentName}” for ${after.employeeName}` }
      }
      if (before.status === 'Expired' && after.status === 'Active') {
        return { action: 'renewed', summary: `Renewed “${after.documentName}” for ${after.employeeName}` }
      }
      return null
    },
  },

  offboarding: {
    label: (doc) => `${doc.employeeName}’s offboarding`,
    link: () => '/offboarding',
    employeeId: (doc) => doc.employeeId,
    created: (doc) => ({
      summary: `Started offboarding ${doc.employeeName} (${doc.reason}), last working day ${formatDay(doc.lastWorkingDay)}`,
      notify: {
        title: 'Offboarding started',
        message: `${doc.employeeName} (${doc.department}) leaves on ${formatDay(doc.lastWorkingDay)}. Reason: ${doc.reason}.`,
        tone: 'info',
      },
    }),
    updated: (before, after) =>
      changed(before, after, 'lastWorkingDay')
        ? {
            action: 'rescheduled',
            summary: `Moved ${after.employeeName}’s last working day to ${formatDay(after.lastWorkingDay)}`,
          }
        : null,
  },

  assets: {
    label: (doc) => `${doc.assetName} (${doc.assetId})`,
    link: () => '/assets',
    employeeId: (doc) => doc.employeeId,
    created: (doc) => ({
      summary: doc.employeeId
        ? `Added ${doc.assetName} (${doc.assetId}) and assigned it to ${doc.employeeName}`
        : `Added ${doc.assetName} (${doc.assetId}) to stock`,
    }),
    updated: (before, after) => {
      if (!changed(before, after, 'employeeId')) return null
      if (!after.employeeId) {
        return { action: 'returned', summary: `${before.employeeName} returned ${after.assetName} (${after.assetId})` }
      }
      return {
        action: 'assigned',
        summary: `Assigned ${after.assetName} (${after.assetId}) to ${after.employeeName}`,
        notify: { title: 'Asset assigned', message: `${after.assetName} was handed to ${after.employeeName}.`, tone: 'info' },
      }
    },
  },
}

export const MODULE_NAMES = Object.keys(MODULES)

/*
 * action: 'created' | 'updated' | 'deleted'
 * before/after: plain objects (after is null for deletes)
 */
export function describeChange(module, action, before, after) {
  const config = MODULES[module]
  if (!config) throw new Error(`Unknown module "${module}"`)

  const doc = after || before
  const specific =
    action === 'created' ? config.created?.(doc)
      : action === 'updated' ? config.updated?.(before, after)
        : null

  const fallbackSummary = {
    created: `Created ${config.label(doc)}`,
    updated: `Updated ${config.label(doc)}`,
    deleted: `Deleted ${config.label(doc)}`,
  }[action]

  const finalAction = specific?.action || action

  return {
    type: `${module}.${finalAction}`,
    module,
    action: finalAction,
    summary: specific?.summary || fallbackSummary,
    employeeId: config.employeeId?.(doc) || '',
    entityId: String(doc._id ?? ''),
    // Deleted records have no page of their own any more.
    link: action === 'deleted' && module === 'employees' ? '/employees' : config.link(doc),
    notify: specific?.notify || null,
  }
}
