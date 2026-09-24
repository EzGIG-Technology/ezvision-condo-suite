import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { reloadForNewBuild } from './components/PageBoundary';
import './index.css';

// A page file from an older deploy failed to load: reload to pick up the current build.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
