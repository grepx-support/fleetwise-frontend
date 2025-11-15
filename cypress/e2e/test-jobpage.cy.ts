describe('DEBUG – Print job row HTML', () => {
  beforeEach(() => {
    cy.viewport(1600, 1000);
    cy.login('admin');
    cy.intercept('GET', '**/jobs**').as('getJobs');
    cy.visit('/jobs');
    cy.wait('@getJobs');
  });

  it('print first REAL row (not skeleton)', () => {

    // 🟢 1. Wait for skeleton loader to disappear
    cy.get('.animate-pulse', { timeout: 20000 }).should('not.exist');

    // 🟢 2. Wait until real rows are rendered
    cy.get('tbody tr', { timeout: 20000 })
      .should('have.length.at.least', 1);

    // 🟢 3. Ensure first row is NOT skeleton placeholder
    cy.get('tbody tr').first().should(($row) => {
      const html = $row.html();
      expect(html).to.not.contain('animate-pulse');
      expect(html).to.not.contain('bg-border-color'); // skeleton placeholder divs
    });

    // 🟢 4. THEN print final real HTML
    cy.get('tbody tr').first().then(($row) => {
      cy.log("===== ROW HTML START =====");
      cy.log($row.html());
      cy.log("===== ROW HTML END =====");

      // also print to browser console
      console.log("ROW HTML", $row.html());
    });

  });
});
