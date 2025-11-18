describe('Drivers CRUD E2E Tests', () => {
     beforeEach(() => {
       // Login as admin (has access to driver management)
       cy.login('admin');
     });
     
     afterEach(() => {
       cy.logout();
     });
     
     it('should list drivers', () => {
       cy.visit('/drivers');
       
       // Wait for real API call
       cy.wait('@getDrivers', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
       
       // Verify page loaded
       cy.contains('Drivers').should('be.visible');
       cy.get('table').should('exist');
       
       // Verify at least one driver from seed data
       cy.get('tbody tr').should('have.length.at.least', 1);
     });
     
     it('should create a new driver', () => {
       cy.visit('/drivers');
       cy.wait('@getDrivers');
       
       // Click Add Driver button
       cy.contains('Add Driver').click();
       
       // Fill form with a valid Singapore mobile number
       const validPhone = '+6591234567'; // Valid Singapore mobile number (8 digits starting with 9)
       cy.get('#name').type('Test Driver');
       // Use a more flexible selector for phone input
       cy.get('input[name="phone"], input[name="mobile"], #phone, [placeholder*="phone"], [placeholder*="mobile"]').first().type(validPhone);
       
       // Submit
       cy.get('button[type="submit"]').contains(/create/i).click();
       
       // Wait for API call
       cy.wait('@createDriver').its('response.statusCode').should('be.oneOf', [200, 201]);
       
       // Verify redirect and new driver visible
       cy.url().should('include', '/drivers');
       cy.wait('@getDrivers');
       cy.contains('Test Driver').should('be.visible');
       cy.contains('+6591234567').should('be.visible');
     });
     
   it('should edit a driver', () => {
  cy.visit('/drivers');
  cy.wait('@getDrivers');

  // Click edit on the row containing Test Driver
  cy.contains('tbody tr', 'Test Driver')
    .should('exist')
    .within(() => {
      // First, find the edit button specifically
      cy.get('button[aria-label="Edit driver"]').should('exist').click({ force: true });
    });

  // Wait for the edit form to be visible directly
  cy.get('form', { timeout: 10000 }).should('be.visible');
  cy.contains('label', 'Name').should('be.visible');
  
  // Find the name input field by its label and fill it with the new name
  cy.contains('label', 'Name').next('input').should('be.visible').clear().type('Updated Test Driver');

  // Submit update
  cy.contains('button', /update/i).click();

  // Wait for redirection back to drivers list
  cy.url().should('include', '/drivers');
  cy.wait('@getDrivers');

  // VERIFY updated name in table
  cy.contains('Updated Test Driver').should('exist');
});

it('should delete a driver', () => {
  cy.visit('/drivers');
  cy.wait('@getDrivers');

  cy.contains('Updated Test Driver').should('be.visible');

  // Refresh to ensure latest data
  cy.visit('/drivers');
  cy.wait('@getDrivers');

  // Click delete button inside matching row
  cy.contains('tbody tr', 'Updated Test Driver')
    .within(() => {
      cy.get('button:has(svg[class*="trash"])', { timeout: 8000 })
        .click({ force: true });
    });

  // Confirm modal
  cy.contains('Delete Driver?').should('be.visible');
  cy.contains('Are you sure you want to delete this driver?').should('be.visible');
  cy.contains('button', 'Delete').click();

  // Wait for delete API + refresh list
  cy.wait('@getDrivers'); 

  // Final verification
  cy.contains('Updated Test Driver').should('not.exist');
});
});