import './assets/main.css'

import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <HeroUIProvider>
      <App />
      <ToastProvider
        placement="bottom-center"
        toastOffset={10}
        toastProps={{
          timeout: 3000
        }}
      />
    </HeroUIProvider>
  </StrictMode>
)
