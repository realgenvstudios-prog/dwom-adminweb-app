import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'motion/react';
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
          {/* Motion-library animations follow the device's reduce-motion setting. */}
          <MotionConfig reducedMotion="user">
            <TooltipProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </MotionConfig>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
  logger.log('✅ React app rendered');
} else {
  logger.error('❌ Root element not found!');
}
