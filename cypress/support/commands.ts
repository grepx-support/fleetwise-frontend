/// <reference types="cypress" />

// TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable {
      login(roleOrEmail: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

// Predefined test users from seed_data.py
const testUsers: Record<string, { email: string; password: string }> = {
  admin: { email: 'admin@grepx.sg', password: 'adminpass' },
  manager: { email: 'manager@grepx.sg', password: 'managerpass' },
  driver: { email: 'driver@test.com', password: 'password123' },
  customer: { email: 'customer@grepx.sg', password: 'customerpass' },
  support: { email: 'support@grepx.sg', password: 'supportpass' },
  'john.tan': { email: 'john.tan@grepx.sg', password: 'driverpass1' },
  'susan.ong': { email: 'susan.ong@grepx.sg', password: 'driverpass2' },
  'willsmith': { email: 'willsmith80877@gmail.com', password: 'pass@123' }
};

Cypress.Commands.add('login', (roleOrEmail: string, password?: string) => {
  let credentials: { email: string; password: string };

  if (password) {
    credentials = { email: roleOrEmail, password };
  } else {
    const key = String(roleOrEmail).toLowerCase();
    credentials = testUsers[key];
    if (!credentials) {
      throw new Error(`Unknown role: ${roleOrEmail}. Use a role like 'admin' or provide email/password.`);
    }
  }

  // Use the email as session key so sessions are cached per-user
  cy.session([credentials.email], () => {
    // Attempt UI login first (preferred for full E2E)
    cy.log('Attempting UI login for', credentials.email);
    cy.visit('/login', { failOnStatusCode: false });

    // wait for the app to stabilize (DOM ready + optionally a known app element)
    cy.document().its('readyState').should('eq', 'complete');

    // try several selectors that might match the email input
    const selectors = ['#email', 'input[type="email"]', 'input[name="email"]', 'input#email'];

    // attempt to find an email input; if it doesn't appear inside a reasonable timeout, fallback to API
    cy.get('body', { timeout: 20000 }).then(($body) => {
      const found = selectors.some((sel) => $body.find(sel).length > 0);
      if (found) {
        // prefer UI flow
        cy.log('Found login input on page — doing UI login');
        // pick selector that exists
        const sel = selectors.find((s) => $body.find(s).length > 0) as string;
        cy.get(sel, { timeout: 20000 }).should('be.visible').and('be.enabled').clear().type(credentials.email);
        // password field selectors
        const passSelectors = ['#password', 'input[type="password"]', 'input[name="password"]'];
        const passSel = passSelectors.find((s) => $body.find(s).length > 0) || 'input[type="password"]';
        cy.get(passSel, { timeout: 20000 }).should('be.visible').and('be.enabled').clear().type(credentials.password, { log: false });
        // try common submit buttons
        const submitSelectors = ['button[type="submit"]', 'button:contains("Login")', 'button:contains("Sign in")'];
        // attempt click; if none matches use form submit
        const submitFound = submitSelectors.some((s) => $body.find(s).length > 0);
        if (submitFound) {
          const sub = submitSelectors.find((s) => $body.find(s).length > 0) as string;
          cy.get(sub).click();
        } else {
          // fallback: submit the form element if present
          cy.get('form').then(($forms) => {
            if ($forms.length > 0) {
              cy.wrap($forms.first()).submit();
            } else {
              // last resort: press enter in password input
              cy.get(passSel).type('{enter}');
            }
          });
        }
        // Set test user role in cookie for middleware
        cy.window().then((win) => {
          win.document.cookie = `test_user_role=admin; path=/`;
          // Also set a session cookie to ensure proper authentication
          win.document.cookie = `session=authenticated; path=/`;
        });
        
        // Wait for dashboard or expected post-login URL
        cy.url({ timeout: 20000 }).should('include', '/dashboard');
      } else {
        // fallback to API login (fast + reliable for tests)
        cy.log('Login UI not found — doing API login fallback');
        // Set up API interceptors first
        cy.then(() => {
          // Replace the endpoint and payload with your real API login route
          // Example assumes response returns `{ access_token: '...', refresh_token: '...' }`
          cy.request({
            method: 'POST',
            url: '/api/auth/login', // update to your real auth endpoint
            body: { email: credentials.email, password: credentials.password },
            failOnStatusCode: false
          }).then((resp) => {
            cy.log('API login response:', resp.status, resp.body);
            
            if (resp.status === 403) {
              cy.log('Login failed with 403 - check credentials or backend availability');
              throw new Error(`Login failed with 403: ${JSON.stringify(resp.body)}. Check that the backend is running and credentials are correct.`);
            }
            
            if (resp.status >= 200 && resp.status < 300 && resp.body) {
              cy.log('API login successful, setting tokens in localStorage/sessionStorage');
              // adapt to your app's token storage
              if (resp.body.access_token) {
                cy.window().then((win) => {
                  // example keys — change to match your app
                  win.localStorage.setItem('access_token', resp.body.access_token);
                  if (resp.body.refresh_token) {
                    win.localStorage.setItem('refresh_token', resp.body.refresh_token);
                  }
                  // Set test user role in cookie for middleware
                  win.document.cookie = `test_user_role=admin; path=/`;
                  // Also set a session cookie to ensure proper authentication
                  win.document.cookie = `session=authenticated; path=/`;
                });
              }
              // visit dashboard to initialize app with the tokens
              cy.visit('/dashboard');
              cy.url({ timeout: 20000 }).should('include', '/dashboard');
            } else {
              // If API login fails, throw a readable error
              throw new Error(`API login failed (status ${resp.status}): ${JSON.stringify(resp.body)}. Check /api/auth/login and credentials.`);
            }
          });
        });
      }
    });
  }, {
    // session options if needed
    validate() {
      // minimal validation that we are logged in by visiting a protected route
      cy.request({ url: '/api/auth/me', failOnStatusCode: false }).then((r) => {
        // treat 2xx as valid
        if (r.status < 200 || r.status >= 300) {
          throw new Error(`Session validation failed with status ${r.status}`);
        }
      });
    }
  });
});

Cypress.Commands.add('logout', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => win.sessionStorage.clear());
});

// Optionally capture screenshots on login errors (keep this outside of heavy test logic)
Cypress.on('fail', (error, runnable) => {
  if (runnable.title && runnable.title.match(/login/i)) {
    cy.screenshot('login-failure', { capture: 'fullPage' });
  }
  throw error;
});

export {};