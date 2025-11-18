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
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');

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
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
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

  describe('UPDATE - Partial Payment', () => {
    it('should add a partial payment successfully', () => {
      // Navigate to customer billing page
      cy.visit('/billing/customer-billing');
      
      // Switch to the Unpaid tab to view invoices by clicking the card
      cy.contains('.rounded-xl', 'Invoice Pending Payments').should('be.visible');
      cy.contains('.rounded-xl', 'Invoice Pending Payments').click({ force: true });
      
      // Wait for initial data to load
      cy.wait('@getUnpaidInvoices', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Click on the first invoice's partial payment button (dollar icon)
      cy.get('tbody tr').first().find('button[aria-label="Record Partial Payment"]').click({ force: true });
      
      // Wait for the modal to appear by looking for the modal container
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/60').should('be.visible');
      
      // Enter a fixed payment amount (10)
      cy.get('input[placeholder="0.00"]').type('10');
      
      // Click Record Payment button
      cy.contains('button', 'Record Payment').click({ force: true });
      
      // Wait for API call and verify success
      cy.wait('@addInvoicePayment', { timeout: 30000 });
      
      // Click the close button (×) in the top right corner of the modal
      cy.get('button[aria-label="Close"]').click({ force: true });
      
      // Verify the modal is closed
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/60').should('not.exist');
    });
  });


  describe('DOWNLOAD - Invoice', () => {
    it('should download an invoice successfully', () => {
      // Navigate to customer billing page
      cy.visit('/billing/customer-billing');
      
      // Switch to the Unpaid tab to view invoices by clicking the card
      cy.contains('.rounded-xl', 'Invoice Pending Payments').should('be.visible');
      cy.contains('.rounded-xl', 'Invoice Pending Payments').click({ force: true });
      
      // Wait for initial data to load
      cy.wait('@getUnpaidInvoices', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Click on the first invoice's download button (arrow down icon)
      cy.get('tbody tr').first().find('button[aria-label="Download Invoice"]').click({ force: true });
      
      // Wait for API call and verify success
      cy.wait('@downloadUnpaidInvoice', { timeout: 30000 });
      
      // Verify success message
      cy.contains('Invoice downloaded successfully').should('be.visible');
    });
  });
});
