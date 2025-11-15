describe('Invoice CRUD E2E Tests', () => {
  beforeEach(() => {
    // Login as admin (has access to all invoice operations)
    cy.login('admin');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('READ - Invoices List', () => {
    it('should display the invoices list', () => {
      // Navigate to the customer billing page
      cy.visit('/billing/customer-billing');

      // Wait for initial unbilled jobs to load
      cy.wait('@getUnbilledJobs', { timeout: 30000 });

      // Switch to the Unpaid tab to view invoices by clicking the card
      cy.contains('.rounded-xl', 'Invoice Pending Payments').click({ force: true });
      
      // Wait for unpaid invoices to load
      cy.wait('@getUnpaidInvoices', { timeout: 30000 });

      // Ensure the table is visible
      cy.get('table').should('be.visible');

      // Verify the table header contains Invoice ID text
      cy.get('table thead')
        .should('contain.text', 'Invoice ID');

      // Verify at least 1 row exists (may vary based on database content)
      cy.get('table tbody tr')
        .should('exist');
    });
  });

  describe('CREATE - Generate Invoice', () => {
    it('should generate a new invoice successfully', () => {
      // Navigate to customer billing page
      cy.visit('/billing/customer-billing');
      
      // Make sure we're on the unbilled jobs tab first
      cy.contains('.rounded-xl', 'Jobs Not Invoiced').click({ force: true });
      
      // Wait for initial data to load
      cy.wait('@getUnbilledJobs', { timeout: 30000 });
      
      // Select at least one job by clicking its checkbox
      cy.get('tbody tr').first().find('input[type="checkbox"]').click({ force: true });
      
      // Click Generate Invoice button
      cy.contains('button', 'Generate Invoice').click({ force: true });
      
      // Wait for API call and verify success
      cy.wait('@generateInvoice', { timeout: 30000 });
      
      // Verify success message
      cy.contains('Invoice download successfully').should('be.visible');
    });
  });

});