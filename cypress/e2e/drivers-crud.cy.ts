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
      cy.get('td:last-child button').eq(0).click({ force: true }); // edit button
    });

  // Wait for a bit to allow the page to load
  cy.wait(2000);

  // Wait a bit more and then try to find the name input field 
  cy.wait(1000);
  
  // Try a more generic approach to find and fill the name input
  cy.get('input').should('exist');
  // Find the first visible text input and fill it with the new name
  cy.get('input[type="text"]').filter(':visible').first().should('be.visible').clear().type('Updated Test Driver');

  // Submit update
  cy.contains('button[type="submit"]', /update/i).click();

  // Wait for a bit to allow the update API call to complete
  cy.wait(2000);

  // Table reload
  cy.visit('/drivers');
  cy.wait('@getDrivers');

  // VERIFY updated name in table
  cy.contains('Updated Test Driver').should('exist');
});

     it('should delete a driver', () => {
       // First verify that the 'Updated Test Driver' exists
       cy.visit('/drivers');
       cy.wait('@getDrivers');
       cy.contains('Updated Test Driver').should('be.visible');
       
       // Refresh the page to ensure we have the latest data
       cy.visit('/drivers');
       cy.wait('@getDrivers');
       
       // Find and delete the 'Updated Test Driver'
       cy.get('tbody tr').contains('Updated Test Driver').within(() => {
         // Click delete button (look for trash icon or Delete text)
         // Look for trash icon with more flexible selectors
         cy.get('[class*="trash"], [class*="delete"], [class*="Delete"], svg, button[aria-label*="Delete"], button[title*="Delete"], button:contains("Delete"), .icon, [data-testid*="delete"]').first().click({ force: true });
       });
       
       // Confirm deletion in the modal dialog
       cy.contains('Delete Driver?').should('be.visible');
       cy.contains('Are you sure you want to delete this driver?').should('be.visible');
       cy.contains('Delete').click();
       
       // Wait for a bit to allow the delete API call to complete
       cy.wait(1000);
       
       // Verify driver removed from list
       cy.wait('@getDrivers');
       cy.contains('Updated Test Driver').should('not.exist');
     });
   });