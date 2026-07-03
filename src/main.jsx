import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LogsWindow from './LogsWindow.jsx'

const isLogs = window.location.hash === '#logs';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isLogs ? <LogsWindow /> : <App />}
  </StrictMode>,
)
