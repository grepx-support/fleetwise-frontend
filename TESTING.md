# Testing Guide

This document explains how to run and manage tests for the FleetWise frontend application.

## Cypress E2E Tests

### Running All E2E Tests
```bash
npm run test:e2e
```

### Running Specific Test Suites
```bash
# Run only jobs CRUD tests
npm run test:e2e:jobs

# Run only drivers CRUD tests
npm run e2e:drivers
```

### Running Tests in Interactive Mode
```bash
npm run test:e2e:open
```

### Test Stability Audit
To run a stability audit that executes tests multiple times to identify flaky tests:
```bash
npm run test:stability-audit
```

## Test Structure

### Jobs CRUD Tests
Located in `cypress/e2e/jobs-crud.cy.ts`, these tests cover:
- Creating new jobs
- Reading/Viewing job lists
- Updating existing jobs
- Deleting jobs
- Error handling
- UI navigation

### Drivers CRUD Tests
Located in `cypress/e2e/drivers-crud.cy.ts`, these tests cover:
- Creating new drivers
- Reading/Viewing driver lists
- Updating existing drivers
- Deleting drivers

## Writing Tests

### Selectors
Tests use placeholder-based selectors for reliability:
```javascript
// Good - uses placeholder text
cy.get('input[placeholder*="Customer Name"]')

// Avoid - uses implementation-specific selectors
cy.get('#customer_name')
```

### Test Data
Tests use mock data defined at the top of each test file to ensure consistency.

### Best Practices
1. Always wait for API calls using `cy.wait('@alias')`
2. Use descriptive test names
3. Test both happy paths and error conditions
4. Clean up test data when possible

## Troubleshooting

### Tests Failing Intermittently
Run the stability audit to identify flaky tests:
```bash
npm run test:stability-audit
```

### Timeout Issues
Increase timeout values in `cypress.config.js` if tests are timing out.

### Debugging
Add `cy.pause()` at any point in a test to pause execution and inspect the state.