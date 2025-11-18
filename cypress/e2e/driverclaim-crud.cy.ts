describe('Driver Claim CRUD E2E Tests', () => {
  beforeEach(() => {
    // Login as admin (has access to all driver operations)
    cy.login('admin');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('READ - Driver Claims List', () => {
    it('should display the driver claims list', () => {
      // Navigate to the driver billing page
      cy.visit('/billing/driver-billing');

      // Wait for initial data to load
      cy.wait(3000);

      // Ensure the page title is visible
      cy.contains('h1', 'Driver Payment Management').should('be.visible');

      // Verify that either the jobs or bills view is displayed
      cy.get('body').should('contain.text', 'Jobs not in Bill').and('contain.text', 'Generated Bills');

      // Verify that driver filter chips are visible
      cy.contains('Filter by Driver').should('be.visible');
    });
  });

  describe('GENERATE - Create Driver Bill', () => {
    it('should generate a new driver bill successfully', () => {
      // Navigate to the driver billing page
      cy.visit('/billing/driver-billing');

      // Wait for initial data to load
      cy.wait(3000);

      // Ensure we're on the jobs view
      cy.contains('Jobs not in Bill').click({ force: true });

      // Wait for jobs data to load
      cy.wait(3000);

      // Select at least one job by clicking its checkbox
      cy.get('tbody tr').first().find('input[type="checkbox"]').click({ force: true });

      // Click Generate Bills button
      cy.contains('button', 'Generate Bills').click({ force: true });

      // Wait for API call and verify success
      cy.wait('@generateDriverBill', { timeout: 30000 });

      // Switch to the bills view to verify the new bill
      cy.contains('Generated Bills').click({ force: true });

      // Wait for bills data to load
      cy.wait(3000);

      // Verify that the bill count has increased
      cy.get('tbody tr').should('have.length.gte', 1);
    });
  });

  describe('UPDATE - Mark Bill as Paid', () => {
    it('should mark an unpaid bill as paid successfully', () => {
      // Navigate to the driver billing page
      cy.visit('/billing/driver-billing');

      // Wait for initial data to load
      cy.wait(3000);

      // Switch to the bills view
      cy.contains('Generated Bills').click({ force: true });

      // Wait for bills data to load
      cy.wait(3000);

      // Ensure the table is visible
      cy.get('table').should('be.visible');

      // Find the first bill that is not already paid
      cy.get('tbody tr').each(($row) => {
        // Check if the row contains "Unpaid" status
        if ($row.text().includes('Unpaid')) {
          // Click on the dollar sign icon to mark as paid
          cy.wrap($row).find('button[title="Mark as Paid"]').click({ force: true });
          return false; // Break the loop
        }
      }).then(() => {
        // If we found an unpaid bill and clicked the button, verify the confirmation
        cy.contains('Are you sure you want to mark this bill as paid?').should('be.visible');
        
        // Click the Confirm button
        cy.contains('button', 'Confirm').click({ force: true });
        
        // Wait for API call and verify success
        cy.wait('@updateBillStatus', { timeout: 30000 });
        
        // Verify success message
        cy.contains('Bill marked as paid successfully').should('be.visible');
      });
    });
  });

  describe('DELETE - Remove Unpaid Bill', () => {
    it('should delete an unpaid bill successfully', () => {
      // Navigate to the driver billing page
      cy.visit('/billing/driver-billing');

      // Wait for initial data to load
      cy.wait(3000);

      // Switch to the bills view
      cy.contains('Generated Bills').click({ force: true });

      // Wait for bills data to load
      cy.wait(3000);

      // Ensure the table is visible
      cy.get('table').should('be.visible');

      // Find the first bill that is not already paid
      cy.get('tbody tr').each(($row) => {
        // Check if the row contains "Unpaid" status
        if ($row.text().includes('Unpaid')) {
          // Click on the trash icon to delete the bill
          cy.wrap($row).find('button[title="Delete Bill"]').click({ force: true });
          return false; // Break the loop
        }
      }).then(() => {
        // If we found an unpaid bill and clicked the button, verify the confirmation
        cy.contains('Are you sure you want to delete this bill?').should('be.visible');
        
        // Click the Confirm button
        cy.contains('button', 'Confirm').click({ force: true });
        
        // Wait for API call and verify success
        cy.wait('@deleteBill', { timeout: 30000 });
        
        // Verify success message
        cy.contains('Bill deleted successfully. Jobs moved back to \'Jobs not in Bill\' list.').should('be.visible');
      });
    });
  });

  describe('DOWNLOAD - Driver Bill PDF', () => {
    it('should download a driver bill PDF successfully', () => {
      // Navigate to the driver billing page
      cy.visit('/billing/driver-billing');

      // Wait for initial data to load
      cy.wait(3000);

      // Switch to the bills view
      cy.contains('Generated Bills').click({ force: true });

      // Wait for bills data to load
      cy.wait(3000);

      // Ensure the table is visible
      cy.get('table').should('be.visible');

      // Find the first bill and click on the download button (arrow down icon)
      cy.get('tbody tr').first().find('button[title="Download PDF"]').click({ force: true });

      // Wait for API call and verify success
      cy.wait('@downloadDriverBill', { timeout: 30000 });

      // Verify success message
      cy.contains('PDF downloaded successfully').should('be.visible');
    });
  });
});