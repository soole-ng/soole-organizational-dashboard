import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const isMobile = window.innerWidth < 768

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position={isMobile ? 'bottom-center' : 'bottom-right'}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#042011',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            padding: '12px 16px',
            border: '1px solid #e5e5e5',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          success: {
            duration: 2500,
            iconTheme: { primary: '#1d754c', secondary: '#fff' }
          },
          error: {
            duration: 5000,
            iconTheme: { primary: '#ff3f3f', secondary: '#fff' }
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
