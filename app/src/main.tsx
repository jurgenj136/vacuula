import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { AppProvider } from './context/AppContext'
import './i18n'
import './theme/theme.css'
import './theme'
import './mascot'
import './index.css'
import App from './app.tsx'
import { BASE_PATH } from './http.ts';

const render = () => createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <BrowserRouter basename={BASE_PATH}>
      <App />
    </BrowserRouter>
  </AppProvider>,
)

// `pnpm dev:mock` only; dropped from production builds
if (import.meta.env.DEV && import.meta.env.MODE === 'mock') {
  import('./mocks/browser').then(mocks => mocks.startMocking()).then(render)
} else {
  render()
}
