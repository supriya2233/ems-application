import { syncEmployeeLeaveStatus } from './leaveService.js'
import { notifyOverdueSteps } from './onboardingService.js'
import { checkDocumentExpiry } from './documentService.js'

/*
 * Background checks. They run once when the server starts, then
 * every hour (Node's own setInterval, no cron library needed).
 */
const JOBS = [
  { name: 'leave-status', run: () => syncEmployeeLeaveStatus(), report: (n) => `updated ${n} employee status(es)` },
  { name: 'onboarding-overdue', run: () => notifyOverdueSteps(), report: (n) => `sent ${n} overdue onboarding reminder(s)` },
  { name: 'document-expiry', run: () => checkDocumentExpiry(), report: (n) => `flagged ${n} expired / expiring document(s)` },
]

export function startScheduledJobs(intervalMs = 60 * 60 * 1000) {
  const runAll = async () => {
    for (const job of JOBS) {
      try {
        const count = await job.run()
        if (count > 0) console.log(`[${job.name}] ${job.report(count)}`)
      } catch (error) {
        console.error(`[${job.name}] failed:`, error.message)
      }
    }
  }

  runAll()
  return setInterval(runAll, intervalMs)
}
