import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Debug: Check if electron API is available
const hasElectron = typeof window.electron !== 'undefined'
console.log('Electron API available:', hasElectron)

// Show something immediately to test rendering
const root = document.getElementById('root')!
root.innerHTML = '<div style="padding: 20px; font-family: system-ui;">Loading AltFinder... (Electron: ' + hasElectron + ')</div>'

if (hasElectron) {
  console.log('Electron API methods:', Object.keys(window.electron))
}

// Error boundary for debugging
window.onerror = (msg, url, line, col, error) => {
  console.error('Global error:', { msg, url, line, col, error })
  root.innerHTML = '<div style="padding: 20px; color: red;">Error: ' + msg + '</div>'
}

window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason)
}

// Small delay to see the loading message
setTimeout(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}, 100)
