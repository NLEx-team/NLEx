import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './shared/ui/styles/index.css'
import { AuthProvider } from './features/auth'
import App from './features/app/App.tsx'
import { initTheme } from './shared/hooks'
import { initIcons } from './shared/icons'

initTheme();
initIcons();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
