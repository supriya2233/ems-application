import ModuleDashboard from '../components/common/ModuleDashboard'
import { calendarData } from '../data/remainingModules'

function Calendar() {
  return <ModuleDashboard {...calendarData} />
}

export default Calendar