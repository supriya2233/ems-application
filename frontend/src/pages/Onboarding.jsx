import ModuleDashboard from '../components/common/ModuleDashboard'
import { onboardingData } from '../data/remainingModules'

function Onboarding() {
  return <ModuleDashboard {...onboardingData} />
}

export default Onboarding