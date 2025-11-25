/**
 * Application Entry Point
 * ------------------------------------------------------------
 * Bootstraps the React application and mounts the root component.
 *
 * Responsibilities:
 * - Enable React StrictMode for development-only runtime checks
 * - Provide BrowserRouter for client-side SPA routing
 * - Render the <App /> component into the DOM root container
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

/** Initialize the root container using React 18's createRoot API */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Render the application tree.
 *
 * <React.StrictMode>:
 *   - Activates additional checks during development
 *   - Highlights unintended side-effects and unsafe patterns
 *
 * <BrowserRouter>:
 *   - Enables declarative SPA navigation via React Router
 *   - Manages history stack for client-side routing
 */
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
