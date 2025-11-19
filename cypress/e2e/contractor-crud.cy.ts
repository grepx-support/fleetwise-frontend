describe('Contractors CRUD E2E Tests', () => {
  beforeEach(() => {
    // Login as admin (has access to contractor management)
    cy.login('admin');
  });
  
  afterEach(() => {
    cy.logout();
  });
  
  it('should list contractors', () => {
    cy.visit('/contractors');
    
    // Wait for real API call
    cy.wait('@getContractors', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    
    // Verify page loaded
    cy.contains('Contractors').should('be.visible');
    cy.get('table').should('exist');
    
    // Verify at least one contractor from seed data
    cy.get('tbody tr').should('have.length.at.least', 1);
  });
  
  it('should create a new contractor', () => {
    cy.visit('/contractors');
    cy.wait('@getContractors');
    
    // Click Add Contractor button
    cy.contains('Add Contractor').click();
    
    // Wait for the form to be visible
    cy.get('form').should('be.visible');
    
    // Fill form with valid data
    const validPhone = '+6591234567'; // Valid Singapore mobile number (8 digits starting with 9)
    
    // Use name attributes to select form fields and handle re-renders
    cy.get('input[name="name"]', { timeout: 10000 }).should('be.visible').as('nameInput');
    cy.get('@nameInput').type('Test Contractor');
    
    cy.get('input[name="contact_person"]', { timeout: 10000 }).should('be.visible').as('contactPersonInput');
    cy.get('@contactPersonInput').type('Test Contact Person');
    
    cy.get('input[name="contact_number"]', { timeout: 10000 }).should('be.visible').as('contactNumberInput');
    cy.get('@contactNumberInput').type(validPhone);
    
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').as('emailInput');
    cy.get('@emailInput').type('testcontractor@example.com');
    
    // Select status
    cy.get('select[name="status"]', { timeout: 10000 }).should('be.visible').as('statusSelect');
    cy.get('@statusSelect').select('Active');
    
    // For the pricing matrix, we'll leave the default values as they are
    
    // Submit
    cy.contains('button', 'Create Contractor').click();
    
    // Wait for API call
    cy.wait('@createContractor').its('response.statusCode').should('be.oneOf', [200, 201]);
    
    // Verify redirect and new contractor visible
    cy.url().should('include', '/contractors');
    cy.wait('@getContractors');
    cy.contains('Test Contractor').should('be.visible');
    cy.contains('testcontractor@example.com').should('be.visible');
  });

  it('should edit a contractor', () => {
    cy.visit('/contractors');
    cy.wait('@getContractors');

    // Click edit on Test Contractor
    cy.contains('tbody tr', 'Test Contractor')
      .should('exist')
      .within(() => {
        cy.get('button[aria-label="Edit contractor"]').click({ force: true });
      });

    // Ensure form is visible
    cy.get('form', { timeout: 10000 }).should('be.visible');

    // Re-query input to avoid stale element issues
    cy.get('input[name="name"]').as('nameInput');

    cy.get('@nameInput')
      .should('be.visible')
      .clear();

    cy.get('@nameInput')
      .type('Updated Test Contractor', { delay: 0 });

    // Save changes
    cy.contains('button', /save/i).click();

    // Redirect back
    cy.url().should('include', '/contractors');

    // Wait for list load
    cy.wait('@getContractors');

    // Verify updated name
    cy.contains('Updated Test Contractor').should('exist');
  });
  
  it('should delete a contractor', () => {
    cy.visit('/contractors');
    cy.wait('@getContractors');
    
    cy.contains('Updated Test Contractor').should('be.visible');
    
    // Click delete button inside matching row
    cy.contains('tbody tr', 'Updated Test Contractor')
      .within(() => {
        cy.get('button[aria-label="Delete contractor"]', { timeout: 8000 })
          .click({ force: true });
      });
    
    // Confirm modal
    cy.contains('Delete Contractor?').should('be.visible');
    cy.contains('Are you sure you want to delete this contractor? This action cannot be undone.').should('be.visible');
    cy.contains('button', 'Delete').click();
    
    // Wait for delete API + refresh list
    cy.wait('@getContractors'); 
    
    // Final verification
    cy.contains('Updated Test Contractor').should('not.exist');
  });
});