describe('API Interception Tests', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.login('admin');
  });

  it('should intercept jobs API calls', () => {
    // Intercept jobs API calls
    cy.intercept('GET', '/api/jobs/table*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            customer_name: 'Test Customer',
            type_of_service: 'Point to Point',
            pickup_date: '2024-06-01',
            pickup_location: 'Test Location',
            dropoff_location: 'Test Destination',
            final_price: 100.00,
            status: 'Pending'
          }
        ],
        total: 1,
        page: 1,
        per_page: 10,
        pages: 1,
      },
    }).as('getJobs');

    // Visit the jobs page
    cy.visit('/jobs');

    // Wait for the API call
    cy.wait('@getJobs');

    // Verify the mocked data is displayed
    cy.contains('Test Customer').should('be.visible');
    cy.contains('Test Location').should('be.visible');
  });

  it('should intercept drivers API calls', () => {
    // Intercept drivers API calls
    cy.intercept('GET', '/api/drivers*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: 1,
            name: 'Test Driver',
            mobile: '+1234567890'
          }
        ],
        total: 1,
        page: 1,
        per_page: 10,
        pages: 1,
      },
    }).as('getDrivers');

    // Visit the drivers page
    cy.visit('/drivers');

    // Wait for the API call
    cy.wait('@getDrivers');

    // Verify the mocked data is displayed
    cy.contains('Test Driver').should('be.visible');
    cy.contains('+1234567890').should('be.visible');
  });
});