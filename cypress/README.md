# Cypress E2E Tests Setup

## Prerequisites
1. Backend running at `http://localhost:5000`
2. Frontend running at `http://localhost:3000`
3. Database seeded with test data (`python seed_data.py`)

## Quick Start
```bash
# Terminal 1: Backend
cd fleetwise-backend/backend
source venv/bin/activate
flask run

# Terminal 2: Frontend
cd fleetwise-frontend
npm run dev

# Terminal 3: Cypress
cd fleetwise-frontend
npm run test:e2e:open  # Interactive mode
# OR
npm run test:e2e:headless  # Headless mode
```

## Test Results

### Jobs CRUD Tests
- Tests executed: 1
- Tests passed: 0
- Tests failed: 1
- Execution time: 1 minute, 12 seconds
- Test file: jobs-crud.cy.ts

Test execution summary:
```
Jobs CRUD E2E Tests
  EDIT - Update Job
    × should filter by Job ID 110, edit the job, and verify passenger name update (1m 12s)
```

Test failure details:
- Error: `AssertionError: Timed out retrying after 15000ms: Expected to find element: button[aria-label="Edit job"], but never found it. Queried from: <tr.border-b.border-border-color/60.transition-all.duration-200.cursor-pointer.group.relative.hover:bg-background-light/70> -> .first()`
- Location: jobs-crud.cy.ts:160:13

Failure analysis:
**Progress Made**: 
- The previous 500 Internal Server Error has been resolved
- The application is now loading correctly and the test is able to run
- The test is now failing at the element selection level, which is progress from the previous server error

**Current Issue**: 
The test is unable to find the edit button with `aria-label="Edit job"` in the job table. This could be due to:
1. The job with ID 110 doesn't exist in the database
2. The edit button is not visible or accessible
3. The selector for the edit button is incorrect
4. The UI structure has changed and the test needs to be updated
5. Timing issues where elements are not loaded properly before the test tries to interact with them

**Previous Issues Resolved**: 
- The Next.js application was successfully built using `npm run build` which generated the required build artifacts including the routes-manifest.json file.
- The previous error about missing routes-manifest.json has been resolved.
- Changes have been made to the cypress.config.js file.
- The 500 Internal Server Error has been resolved.

Note: The READ and CREATE tests have been commented out in the current version of the test file.

Icon Rendering Issue:
- Icons may not render correctly due to viewport size detection or pixel ratio mismatches
- Expected Outcome: Icons should render at correct size without clipping
- Responsive CSS should not hide the action column
- Verification needed: Check that icons render properly and action column is visible



### Invoice CRUD Tests
- Tests executed: 4
- Tests passed: 4
- Tests failed: 0
- Execution time: 1 minute, 4 seconds
- Test file: invoice-crud.cy.ts

Test execution summary:
```
Invoice CRUD E2E Tests
  READ - Invoices List
    √ should display the invoices list (17287ms)
  CREATE - Generate Invoice
    √ should generate a new invoice successfully (9029ms)
  UPDATE - Partial Payment
    √ should add a partial payment successfully (8068ms)
  DELETE - Invoice
    √ should delete an invoice successfully based on its status (3949ms)
```

## Test Users (from seed_data.py)
- Admin: `admin@grepx.sg` / `adminpass`
- Manager: `manager@grepx.sg` / `managerpass`
- Support/Accountant: `support@grepx.sg` / `supportpass`
- Driver Users:
  - Driver 1: `john.tan@grepx.sg` / `driverpass1`
  - Driver 2: `susan.ong@grepx.sg` / `driverpass2`
- Customer Users:
  - Regular Customer: `customer@grepx.sg` / `customerpass`
  - Will Smith Test Customer: `willsmith80877@gmail.com` / `pass@123`

## Troubleshooting

### "Timed out waiting for API request"
- **Cause**: Backend not running or wrong port
- **Fix**: Check `http://localhost:5000/api/health-check` returns 200

### "Expected to find content but never did"
- **Cause**: Not logged in (auth required)
- **Fix**: Ensure `cy.login('admin')` called in `beforeEach()`

### "401 Unauthorized"
- **Cause**: Session expired or cookies cleared
- **Fix**: Re-run test (login command uses `cy.session()` for caching)

### Database locked error
- **Cause**: Multiple processes accessing SQLite
- **Fix**: Close DBeaver, stop duplicate Flask processes

### Icon Rendering Issues
- **Cause**: Viewport size detection or pixel ratio mismatches
- **Fix**: Ensure responsive CSS doesn't hide action column, verify icons render at correct size without clipping

### Element Not Found Error
- **Cause**: Test unable to locate specific UI elements (e.g., edit button)
- **Fix**: Verify element exists, check selectors, add waits for dynamic content, ensure proper test data
- **Note**: This is the current error - test can load the page but cannot find the edit button