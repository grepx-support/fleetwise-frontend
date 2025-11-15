const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Frontend dev server
    specPattern: 'cypress/e2e/**/*.cy.{js,ts,jsx,tsx}',
    supportFile: 'cypress/support/e2e.ts',
      chromeWebSecurity: false,  
    env: {
      apiUrl: 'http://localhost:5000', // Backend API
    },
    
    // Performance optimizations
    video: false,
    screenshotOnRunFailure: true,
    
    // Increased timeouts for local dev (slow DB queries)
    defaultCommandTimeout: 15000, // Increased from 10s
    requestTimeout: 15000,
    responseTimeout: 15000,
    
    // Retry configuration
    retries: {
      runMode: 2, // Retry flaky tests in CI
      openMode: 0, // No retry in interactive mode
    },
    
    viewportWidth: 1280,
    viewportHeight: 720,
    
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
      
      return config;
    },
  },
});