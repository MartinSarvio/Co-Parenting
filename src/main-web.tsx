import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './web/web-index.css';
import { WebApp } from './web/WebApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebApp />
  </StrictMode>,
);
