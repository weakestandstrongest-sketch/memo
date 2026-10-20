import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Root } from './Root';
import { startSplash } from './splash';
// Self-hosted fonts (no request to Google; only the characters actually shown are downloaded)
import '@fontsource/shippori-mincho/500.css';
import '@fontsource/shippori-mincho/600.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import './styles.css';

startSplash();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
