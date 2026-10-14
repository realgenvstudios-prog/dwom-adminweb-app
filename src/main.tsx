import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { logger } from './utils/logger';

logger.log('🚀 main.tsx loaded - React starting...');

const rootElement = document.getElementById('root');
logger.log('📦 Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        {/* Light / dark / system, remembered per browser (toggle in the header). */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="dwom-admin-theme">
          <TooltipProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
  logger.log('✅ React app rendered');
} else {
  logger.error('❌ Root element not found!');
}
