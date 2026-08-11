import ModuleDashboard from '../components/common/ModuleDashboard'
import { notificationsData } from '../data/remainingModules'

function Notifications() {
  return <ModuleDashboard {...notificationsData} />
}

export default Notifications