import ModuleDashboard from '../components/common/ModuleDashboard'
import { recruitmentData } from '../data/remainingModules'

function Recruitment() {
  return <ModuleDashboard {...recruitmentData} />
}

export default Recruitment