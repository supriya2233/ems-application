import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
// Order matters: tokens first, then legacy styles, then the
// redesigned sections, which override older rules when equally specific.
import './styles/tokens.css'
import './index.css'
import './styles/layout.css'
import './styles/dashboard.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)