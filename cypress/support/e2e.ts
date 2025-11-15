// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import { setupApiInterceptions } from './api-helpers';

// Setup API intercepts before each test
beforeEach(() => {
  setupApiInterceptions();

  cy.window().then((win) => {
    // Check if window and document are available before manipulating DOM
    if (win && win.document) {
      const style = win.document.createElement('style');
      style.innerHTML = `
        /* Force action column buttons to render inside Cypress */
        td:last-child button {
          min-width: 32px !important;
          min-height: 32px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* Ensure SVG icons display correctly */
        td:last-child svg {
          width: 16px !important;
          height: 16px !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: inline-block !important;
        }
      `;
      win.document.head.appendChild(style);
    }
  });
});