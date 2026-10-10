import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { BrowserRouter } from 'react-router-dom';
import { logger } from './utils/logger';

logger.log('🚀 main.tsx loaded - React starting...');

const rootElement = document.getElementById('root');
logger.log('📦 Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
  logger.log('✅ React app rendered');
} else {
  logger.error('❌ Root element not found!');
}
