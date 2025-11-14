describe('Authentication Tests', () => {
  it('should login as admin successfully', () => {
    cy.login('admin');
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should login as manager successfully', () => {
    cy.login('manager');
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should login as driver successfully', () => {
    cy.login('driver');
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should login as customer successfully', () => {
    cy.login('customer');
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.login('admin');
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
    
    cy.logout();
    cy.visit('/login');
    cy.contains('Login').should('be.visible');
  });
});