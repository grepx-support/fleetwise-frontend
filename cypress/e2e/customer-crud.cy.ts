describe('Customers CRUD E2E Tests', () => {
  beforeEach(() => {
    // Login as admin (has access to customer management)
    cy.login('admin');
  });
  
  afterEach(() => {
    cy.logout();
  });
  
  it('should list customers', () => {
    cy.visit('/customers');
    
    // Wait for real API call
    cy.wait('@getCustomers', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    
    // Verify page loaded
    cy.contains('Customers').should('be.visible');
    cy.get('table').should('exist');
    
    // Verify at least one customer from seed data
    cy.get('tbody tr').should('have.length.at.least', 1);
  });
  
  it('should create a new customer', () => {
    cy.visit('/customers');
    cy.wait('@getCustomers');
    
    // Click Add Customer button
    cy.contains('Add Customer').click();
    
    // Wait for the form to be visible
    cy.get('form').should('be.visible');
    
    // Fill form with valid data
    const validPhone = '+6591234567'; // Valid Singapore mobile number (8 digits starting with 9)
    
    // Use name attributes to select form fields and handle re-renders
    cy.get('input[name="name"]', { timeout: 10000 }).should('be.visible').as('nameInput');
    cy.get('@nameInput').type('Test Customer');
    
    cy.get('input[name="company_name"]', { timeout: 10000 }).should('be.visible').as('companyInput');
    cy.get('@companyInput').type('Test Contact Person');
    
    cy.get('#customer-email', { timeout: 10000 }).should('be.visible').as('emailInput');
    cy.get('@emailInput').type('testcustomer@example.com');
    
    cy.get('input[name="mobile"]', { timeout: 10000 }).should('be.visible').as('mobileInput');
    cy.get('@mobileInput').type(validPhone);
    
    // Select status
    cy.get('select[name="status"]', { timeout: 10000 }).should('be.visible').as('statusSelect');
    cy.get('@statusSelect').select('Active');
    
    // For the pricing matrix, we'll leave the default values as they are
    
    // Submit
    cy.contains('button', 'Save Customer').click();
    
    // Wait for API call
    cy.wait('@createCustomer').its('response.statusCode').should('be.oneOf', [200, 201]);
    
    // Verify redirect and new customer visible
    cy.url().should('include', '/customers');
    cy.wait('@getCustomers');
    cy.contains('Test Customer').should('be.visible');
    cy.contains('testcustomer@example.com').should('be.visible');
  });

  it('should edit a customer', () => {
  cy.visit('/customers');
  cy.wait('@getCustomers');

  // Click edit on Test Customer
  cy.contains('tbody tr', 'Test Customer')
    .should('exist')
    .within(() => {
      cy.get('button[aria-label="Edit customer"]').click({ force: true });
    });

  // Ensure form is visible
  cy.get('form', { timeout: 10000 }).should('be.visible');

  // Re-query input to avoid stale element issues
  cy.get('input[name="name"]').as('nameInput');

  cy.get('@nameInput')
    .should('be.visible')
    .clear();

  cy.get('@nameInput')
    .type('Updated Test Customer', { delay: 0 });

  // Save changes
  cy.contains('button', /save/i).click();

  // Redirect back
  cy.url().should('include', '/customers');

  // Wait for list load
  cy.wait('@getCustomers');

  // Verify updated name
  cy.contains('Updated Test Customer').should('exist');
});
 
  it('should delete a customer', () => {
    cy.visit('/customers');
    cy.wait('@getCustomers');
    
    cy.contains('Updated Test Customer').should('be.visible');
    
    // Click delete button inside matching row
    cy.contains('tbody tr', 'Updated Test Customer')
      .within(() => {
        cy.get('button[aria-label="Delete customer"]', { timeout: 8000 })
          .click({ force: true });
      });
    
    // Confirm modal
    cy.contains('Delete Customer?').should('be.visible');
    cy.contains('Are you sure you want to delete this customer? This action cannot be undone.').should('be.visible');
    cy.contains('button', 'Delete').click();
    
    // Wait for delete API + refresh list
    cy.wait('@getCustomers'); 
    
    // Final verification
    cy.contains('Updated Test Customer').should('not.exist');
  });
});