import ModuleDashboard from '../components/common/ModuleDashboard'
import { performanceData } from '../data/remainingModules'

function Performance() {
  return <ModuleDashboard {...performanceData} />
}

export default Performance