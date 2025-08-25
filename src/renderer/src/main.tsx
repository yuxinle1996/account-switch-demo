import './assets/main.css'

import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <App />
      <ToastProvider
        placement="top-center"
        toastOffset={10}
        toastProps={{
          timeout: 3000
        }}
      />
    </HeroUIProvider>
  </StrictMode>
)
