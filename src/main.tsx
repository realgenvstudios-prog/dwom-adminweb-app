import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { BrowserRouter } from 'react-router-dom';

console.log('🚀 main.tsx loaded - React starting...');

const rootElement = document.getElementById('root');
console.log('📦 Root element:', rootElement);

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
  console.log('✅ React app rendered');
} else {
  console.error('❌ Root element not found!');
}
