import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { installClientIdHeader } from './services/apiClient'
// Order matters: tokens first, then legacy styles, then the
// redesigned sections, which override older rules when equally specific.
import './styles/tokens.css'
import './index.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/dashboard.css'
import './styles/profile.css'
import './styles/notifications.css'
import './styles/leave.css'

// Tag API requests with this tab's ID (see services/apiClient.js).
installClientIdHeader()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)