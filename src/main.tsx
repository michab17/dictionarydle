import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/css/index.css'
import App from './components/App.tsx'
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
