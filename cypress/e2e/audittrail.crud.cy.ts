describe('Audit Trail CRUD Operations', () => {
  beforeEach(() => {
    // Login as admin (has access to audit trails)
    cy.login('admin');
    
    // Intercept API calls for audit trails
    cy.intercept('GET', '**/api/audit-trails**').as('getAuditTrails');
    cy.intercept('GET', '**/api/audit-trails/*').as('getAuditTrail');
    cy.intercept('GET', '**/api/jobs**').as('getJobs');
    cy.intercept('GET', '**/api/jobs/audit-trail**').as('getJobsAuditTrail');
    cy.intercept('GET', '**/api/jobs/audit_trail/*').as('getJobAuditTrail');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('READ - Audit Trail List', () => {
    it('should display the audit trail list page', () => {
      // Navigate to the audit trail page
      cy.visit('/jobs/audit-trail');
      
      // Wait for audit trails to load
      cy.wait('@getJobsAuditTrail', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Ensure the table is visible
      cy.get('table').should('be.visible');
      
      // Verify the page title
      cy.contains('h1', 'Jobs Audit Trail').should('be.visible');
      
      // Verify the table header contains expected columns
      cy.get('table thead')
        .should('contain.text', 'Job ID')
        .and('contain.text', 'Customer Name')
        .and('contain.text', 'Last Modified')
        .and('contain.text', 'Last Change Made')
        .and('contain.text', 'Changed By');
      
      // Verify at least 1 row exists (may vary based on database content)
      cy.get('table tbody tr')
        .should('exist');
    });
    
    it('should display audit trail details when clicking view trail', () => {
      // Navigate to the audit trail page
      cy.visit('/jobs/audit-trail');
      
      // Wait for audit trails to load
      cy.wait('@getJobsAuditTrail', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Click on the first audit trail's view trail button
      cy.get('tbody tr').first().find('button').contains('View Trail').click({ force: true });
      
      // Wait for the specific job audit trail to load
      cy.wait('@getJobAuditTrail', { timeout: 30000 });
      
      // Verify audit trail modal is visible
      cy.contains('Job Audit Trail').should('be.visible');
    });
  });
  
});