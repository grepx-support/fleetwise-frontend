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

  // Intercept jobs API calls
  cy.intercept('GET', '/api/jobs/table*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('getJobs');
  
  cy.intercept('GET', '/api/jobs/view/*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('getJob');
  
  cy.intercept('POST', '/api/jobs/add', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('createJob');
  
  cy.intercept('PUT', '/api/jobs/*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('updateJob');
  
  cy.intercept('POST', '/api/jobs/delete/*', (req) => {
    req.reply((res) => {
      res.send(res.body);
    });
  }).as('deleteJob');
 
  
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