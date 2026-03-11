import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './web/web.css';
import { WebApp } from './web/WebApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebApp />
  </StrictMode>,
);
