import ModuleDashboard from '../components/common/ModuleDashboard'
import { documentsData } from '../data/remainingModules'

function Documents() {
  return <ModuleDashboard {...documentsData} />
}

export default Documents