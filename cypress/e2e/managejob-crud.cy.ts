describe('Manage Job CRUD Operations', () => {
  beforeEach(() => {
    // Login as admin (has access to manage jobs)
    cy.login('admin');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('READ - Jobs List', () => {
    it('should display the jobs list in manage jobs page', () => {
      // Navigate to the manage jobs page
      cy.visit('/jobs/manage');
      
      // Wait for jobs to load
      cy.wait('@getJobs', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Ensure the table is visible
      cy.get('table').should('be.visible');
      
      // Verify the table header contains expected columns
      cy.get('table thead')
        .should('contain.text', 'Job ID')
        .and('contain.text', 'Customer')
        .and('contain.text', 'Status');
      
      // Verify at least 1 row exists (may vary based on database content)
      cy.get('table tbody tr')
        .should('exist');
    });
    
    it('should display job details when clicking view', () => {
      // Navigate to the manage jobs page
      cy.visit('/jobs/manage');
      
      // Wait for jobs to load
      cy.wait('@getJobs', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Click on the first job's view button (eye icon)
      cy.get('tbody tr').first().find('button[aria-label="View job details"]').click({ force: true });
      
      // Verify job detail card is visible
      cy.get('.bg-background-light').should('be.visible').and('contain.text', 'Job Details');
    });
  });
    describe('UPDATE - Job Status', () => {
    it('should update status of job ID 78 successfully', () => {
      // Navigate to the manage jobs page
      cy.visit('/jobs/manage');
      
      // Wait for jobs to load
      cy.wait('@getJobs', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Filter jobs by ID 78
      cy.get('input[placeholder*="Filter job"]').clear().type('78{enter}');
      
      // Wait for filtering to complete
      cy.wait(1500);
      
      // Verify that job with ID 78 is displayed
      cy.get('tbody tr').should('have.length', 1);
      cy.get('tbody tr').first().should('contain.text', '78');
      
      // Click on the update status button (refresh icon) for job ID 78
      cy.get('tbody tr').first().find('button[aria-label="Update job status"]').as('updateBtn');
      cy.get('@updateBtn').click({ force: true });
      
      // Wait for the modal to appear
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50').should('be.visible');
      
      // Wait for the modal content to be available and then select the first checkbox
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50')
        .find('input[type="checkbox"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .check({ force: true });
      
      // Add a custom remark
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50')
        .find('input[placeholder*="Add remark"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .type('Custom remark for job status update');
      
      // Click Update Status button
      cy.get('button').contains('Update Status').click({ force: true });
      
      // Wait for API call and verify success
      cy.wait('@updateJobStatus', { timeout: 30000 });
      
      // Verify success message
      cy.contains('Successfully updated 1 status transition(s)').should('be.visible');
    });
  });
  
  describe('UPDATE - Job Status (Select All)', () => {
    it('should update status of job ID 28 by selecting all checkboxes', () => {
      // Navigate to the manage jobs page
      cy.visit('/jobs/manage');
      
      // Wait for jobs to load
      cy.wait('@getJobs', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Filter jobs by ID 28
      cy.get('input[placeholder*="Filter job"]').clear().type('28{enter}');
      
      // Wait for filtering to complete
      cy.wait(1500);
      
      // Verify that job with ID 48 is displayed
      cy.get('tbody tr').should('have.length', 1);
      cy.get('tbody tr').first().should('contain.text', '28');
      
      // Click on the update status button (refresh icon) for job ID 28
      cy.get('tbody tr').first().find('button[aria-label="Update job status"]').as('updateBtn');
      cy.get('@updateBtn').click({ force: true });
      
      // Wait for the modal to appear
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50').should('be.visible');
      
      // Click the "Select All" button to select all checkboxes
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50')
        .find('button')
        .contains('Select All', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true });
      
      // Get the last status change time from the modal and set timestamps accordingly
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50')
        .find('.text-xs.bg-blue-50.dark\\:bg-blue-900\\/20.border.border-blue-200.dark\\:border-blue-800', { timeout: 10000 })
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          // Extract the time from the text (e.g., "Last status change was at 18/11/2025 10:35 AM")
          const timeMatch = text.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM))/);
          if (timeMatch) {
            const lastChangeTimeStr = timeMatch[1];
            // Parse the time string to create a Date object
            const [datePart, timePart, period] = lastChangeTimeStr.split(/\s+/);
            const [day, month, year] = datePart.split('/');
            let [hours, minutes] = timePart.split(':');
            
            // Convert to 24-hour format
            if (period === 'PM' && hours !== '12') {
              hours = String(parseInt(hours) + 12);
            } else if (period === 'AM' && hours === '12') {
              hours = '00';
            }
            
            // Create base time for setting timestamps
            const baseTime = new Date(`${year}-${month}-${day}T${hours.padStart(2, '0')}:${minutes}:00`);
            
            // Set different timestamps for each status transition
            cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50')
              .find('input[type="datetime-local"]', { timeout: 10000 })
              .should('be.visible')
              .each(($input, index) => {
                // Create timestamps incrementally (1 minute apart) starting from the last status change time
                const timestamp = new Date(baseTime);
                timestamp.setMinutes(timestamp.getMinutes() + index + 1); // Add 1, 2, 3... minutes
                
                const year = timestamp.getFullYear();
                const month = String(timestamp.getMonth() + 1).padStart(2, '0');
                const day = String(timestamp.getDate()).padStart(2, '0');
                const hours = String(timestamp.getHours()).padStart(2, '0');
                const minutes = String(timestamp.getMinutes()).padStart(2, '0');
                
                const datetimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
                cy.wrap($input).type(datetimeStr);
              });
          }
        });
      
      // Add a custom remark to the first remark field
      cy.get('.fixed.inset-0.z-50.flex.items-center.justify-center.bg-black\\/50')
        .find('input[placeholder*="Add remark"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .type('Updating all status transitions for job ID 28');
      
      // Click Update Status button
      cy.get('button').contains('Update Status').click({ force: true });
      
      // Wait for API call and verify success
      cy.wait('@updateJobStatus', { timeout: 30000 });
      
      // Verify success message
      cy.contains('Successfully updated').should('be.visible');
    });
  });
  
  
  describe('CANCEL - Job', () => {
    it('should cancel job ID 38 successfully', () => {
      // Navigate to the manage jobs page
      cy.visit('/jobs/manage');
      
      // Wait for jobs to load
      cy.wait('@getJobs', { timeout: 30000 });
      
      // Additional wait to ensure page is fully loaded
      cy.get('body').should('be.visible');
      
      // Filter jobs by ID 38
      cy.get('input[placeholder*="Filter job"]').clear().type('38{enter}');
      
      // Wait for filtering to complete
      cy.wait(1500);
      
      // Verify that job with ID 38 is displayed
      cy.get('tbody tr').should('have.length', 1);
      cy.get('tbody tr').first().should('contain.text', '38');
      
      // Click on the cancel button (X icon) for job ID 38
      cy.get('tbody tr').first().find('button[aria-label="Cancel job"]').as('cancelBtn');
      cy.get('@cancelBtn').click({ force: true });
      
      // Wait for the cancellation dialog to appear
      cy.contains('Cancel Job').should('be.visible');
      cy.contains('Are you sure you want to cancel this job? Please select a reason for cancellation.').should('be.visible');
      
      // Select a cancellation reason from the dropdown (target the specific select element in the dialog)
      cy.get('select.w-full.rounded-lg').select('Customer Request');
      
      // Click Cancel Job button
      cy.contains('button', 'Cancel Job').click({ force: true });
      
      // Wait for API call and verify success
      cy.wait('@cancelJob', { timeout: 30000 });
      
      // Verify success message
      cy.contains('Job canceled successfully').should('be.visible');
    });
  });
});