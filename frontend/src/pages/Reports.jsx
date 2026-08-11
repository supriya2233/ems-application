import ModuleDashboard from '../components/common/ModuleDashboard'
import { reportsData } from '../data/remainingModules'

function Reports() {
  return <ModuleDashboard {...reportsData} />
}

export default Reports