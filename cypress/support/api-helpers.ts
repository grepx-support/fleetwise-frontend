/// <reference types="cypress" />

// API Interception Helpers
export function setupApiInterceptions(): void {
  // Intercept auth-related API calls
  cy.intercept('POST', '/api/auth/login', (req) => {
    // Determine user role based on email
    let roles = ['admin'];
    let name = 'Test User';
    let email = req.body.email || 'test@example.com';
    
    if (req.body.email === 'admin@grepx.sg') {
      roles = ['admin'];
      name = 'Admin User';
      email = 'admin@grepx.sg';
    } else if (req.body.email === 'manager@grepx.sg') {
      roles = ['manager'];
      name = 'Manager User';
      email = 'manager@grepx.sg';
    } else if (req.body.email === 'driver@test.com') {
      roles = ['driver'];
      name = 'Driver User';
      email = 'driver@test.com';
    } else if (req.body.email === 'customer@grepx.sg') {
      roles = ['customer'];
      name = 'Customer User';
      email = 'customer@grepx.sg';
    } else if (req.body.email === 'support@grepx.sg') {
      roles = ['support'];
      name = 'Support User';
      email = 'support@grepx.sg';
    }
    
    req.reply({
      statusCode: 200,
      body: {
        token: 'fake-jwt-token-for-testing',
        user: {
          id: 1,
          email: email,
          name: name,
          roles: roles
        },
        message: 'Login successful'
      }
    });
  }).as('login');

  // Jobs endpoints - match actual API endpoints from jobsApi.ts
  cy.intercept('GET', '/api/jobs/table*').as('getJobs');
  cy.intercept('GET', '/api/jobs/*').as('getJob'); // Single job by ID
  cy.intercept('POST', '/api/jobs').as('createJob'); // Create new job
  cy.intercept('PUT', '/api/jobs/*').as('updateJob'); // Update existing job
  cy.intercept('DELETE', '/api/jobs/*').as('deleteJob'); // Delete job
  
  // Unbilled jobs endpoint - allow real API call
  cy.intercept('GET', '/api/jobs/unbilled*', (req) => {
    req.continue();
  }).as('getUnbilledJobs');
  
  // Invoice endpoints
  cy.intercept('GET', '/api/invoices').as('getInvoices');
  cy.intercept('GET', '/api/invoices/*').as('getInvoice');
  cy.intercept('POST', '/api/invoices/generate', (req) => {
    req.continue();
  }).as('generateInvoice');
  cy.intercept('PUT', '/api/invoices/*/statusUpdate/*', (req) => {
    req.continue();
  }).as('updateInvoiceStatus');
  cy.intercept('PUT', '/api/invoices/*', (req) => {
    req.continue();
  }).as('updateInvoice');
  cy.intercept('DELETE', '/api/invoices/remove/*', (req) => {
    req.continue();
  }).as('deleteInvoice');
  cy.intercept('GET', '/api/invoices/download/*', (req) => {
    req.continue();
  }).as('downloadInvoice');
  cy.intercept('GET', '/api/invoices/unpaid/download/*', (req) => {
    req.continue();
  }).as('downloadUnpaidInvoice');
  
  // Invoice payment endpoints
  cy.intercept('GET', '/api/invoices/*/payments').as('getInvoicePayments');
  cy.intercept('POST', '/api/invoices/*/payments').as('addInvoicePayment');
  cy.intercept('DELETE', '/api/invoices/*/payments/*').as('deleteInvoicePayment');
  
  // Invoice reports endpoints
  cy.intercept('GET', '/api/invoices/report').as('getInvoiceReport');
  cy.intercept('GET', '/api/invoices/unpaid', (req) => {
    req.continue();
  }).as('getUnpaidInvoices');
  
  // Intercept drivers API calls - allow all requests to go through to real API
  cy.intercept('GET', '/api/drivers*', (req) => {
    // Allow real API call to go through
    req.continue();
  }).as('getDrivers');
  
  cy.intercept('GET', '/api/drivers/*', (req) => {
    // Allow real API call to go through
    req.continue();
  }).as('getDriver');
  
  cy.intercept('POST', '/api/drivers', (req) => {
    // Allow real API call to go through
    req.continue();
  }).as('createDriver');
  
  cy.intercept('PUT', '/api/drivers/*', (req) => {
    // Allow real API call to go through
    req.continue();
  }).as('updateDriver');
  
  cy.intercept('DELETE', '/api/drivers/*', (req) => {
    // Allow real API call to go through
    req.continue();
  }).as('deleteDriver');

  // Intercept customers API calls
  cy.intercept('GET', '/api/customers*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('getCustomers');

  // Intercept vehicles API calls
  cy.intercept('GET', '/api/vehicles*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('getVehicles');

  // Intercept services API calls
  cy.intercept('GET', '/api/services*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('getServices');
  
  // Intercept auth me endpoint
  cy.intercept('GET', '/api/auth/me', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        user: {
          id: 1,
          email: 'admin@grepx.sg',
          name: 'Admin User',
          roles: ['admin']
        }
      }
    });
  }).as('authMe');
}