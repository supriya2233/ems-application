import ModuleDashboard from '../components/common/ModuleDashboard'
import { settingsData } from '../data/remainingModules'

function Settings() {
  return <ModuleDashboard {...settingsData} />
}

export default Settings