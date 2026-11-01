import { getSettings, updateSettings } from '../services/settingsService.js'
import { syncEmployeeLeaveStatus } from '../services/leaveService.js'
import { publish } from '../services/events.js'

// GET /api/settings
export const getSettingsHandler = async (req, res) => {
  res.json({ success: true, data: await getSettings() })
}

// PUT /api/settings  { leaveAllowances?, workingDays?, holidays? }
export const updateSettingsHandler = async (req, res) => {
  const data = await updateSettings(req.body)

  // Holidays and working days decide who is off today.
  await syncEmployeeLeaveStatus()

  publish({
    type: 'settings.updated',
    module: 'settings',
    action: 'updated',
    summary: 'Updated company settings (leave allowances, working days and holidays)',
    employeeId: '',
    entityId: 'company',
    link: '/settings',
    notify: null,
  })

  res.json({ success: true, message: 'Settings saved', data })
}
