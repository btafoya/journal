import { test, expect, Page } from '@playwright/test';
import { IssueLogger } from '../fixtures/issue-logger';

/**
 * Comprehensive CRUD testing for /entries resource
 * Following TEST-PLAN.md Section 7.1
 */

test.describe('Entries CRUD Operations', () => {
  let issueLogger: IssueLogger;
  let testEntryId: string | null = null;
  let testEntryTitle: string;

  test.beforeEach(async ({ page }) => {
    issueLogger = new IssueLogger(page);
    testEntryTitle = `Test Entry ${Date.now()}`;

    // Navigate to entries starting point
    await page.goto('/entries/new');
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    // Save all issues found during testing
    await issueLogger.saveReport('entries-crud-issues.md');
  });

  test.describe('CREATE Operations', () => {
    test('should create entry with valid data (Happy Path)', async ({ page }) => {
      const currentUrl = page.url();

      // Check for console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Fill the form with valid test data
      await test.step('Fill entry form', async () => {
        // Find and fill the title field
        const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        await expect(titleField).toBeVisible({ timeout: 5000 });
        await titleField.fill(testEntryTitle);

        // Find and fill the content/description field (TipTap editor or textarea)
        const contentEditor = page.locator('[contenteditable="true"], textarea[name="content"]').first();
        if (await contentEditor.isVisible()) {
          await contentEditor.click();
          await contentEditor.fill('This is automated test content for CRUD testing.');
        }
      });

      // Submit the form
      await test.step('Submit form', async () => {
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        await submitButton.click();
      });

      // Verify successful creation
      await test.step('Verify creation', async () => {
        // Wait for navigation or success message
        await page.waitForLoadState('networkidle');

        // Check for redirect (should not be on /entries/new anymore)
        const newUrl = page.url();
        if (newUrl === currentUrl) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Create',
            severity: 'High',
            description: 'Form submission did not redirect after successful creation',
            stepsToReproduce: [
              'Navigate to /entries/new',
              'Fill title and content',
              'Click submit',
              'Observe: No redirect occurs',
            ],
            expectedBehavior: 'Should redirect to entry detail page or index',
            actualBehavior: 'Stays on /entries/new page',
            proposedFix: 'Add proper redirect after successful entry creation',
          });
        } else {
          // Extract entry ID from URL if redirected to detail page
          const idMatch = newUrl.match(/\/entries\/([^\/]+)$/);
          if (idMatch) {
            testEntryId = idMatch[1];
          }
        }

        // Check for console errors
        if (consoleErrors.length > 0) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'Functional',
            operation: 'Create',
            severity: 'High',
            description: `Console errors during entry creation: ${consoleErrors.join(', ')}`,
            stepsToReproduce: [
              'Navigate to /entries/new',
              'Fill and submit form',
              'Check browser console',
            ],
            expectedBehavior: 'No JavaScript errors',
            actualBehavior: `Console errors: ${consoleErrors.join(', ')}`,
            proposedFix: 'Fix JavaScript errors in entry creation flow',
          });
        }
      });
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      const currentUrl = page.url();

      // Try to submit empty form
      await test.step('Submit empty form', async () => {
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        await submitButton.click();
        await page.waitForTimeout(1000);
      });

      // Check for validation messages
      await test.step('Verify validation messages', async () => {
        const validationMessages = page.locator('[role="alert"], .error, .text-red-500, .text-destructive');
        const count = await validationMessages.count();

        if (count === 0) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Create',
            severity: 'Medium',
            description: 'No validation messages shown for empty form submission',
            stepsToReproduce: [
              'Navigate to /entries/new',
              'Click submit without filling fields',
              'Observe: No validation messages',
            ],
            expectedBehavior: 'Clear validation messages for required fields',
            actualBehavior: 'No validation feedback shown',
            proposedFix: 'Add client-side form validation with clear error messages',
          });
        }

        // Check if form was incorrectly submitted
        await page.waitForTimeout(1000);
        const newUrl = page.url();
        if (newUrl !== currentUrl) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Create',
            severity: 'Blocker',
            description: 'Empty form was submitted successfully (should be blocked)',
            stepsToReproduce: [
              'Navigate to /entries/new',
              'Click submit without filling fields',
              'Observe: Form submits anyway',
            ],
            expectedBehavior: 'Form validation prevents submission',
            actualBehavior: 'Empty form was submitted',
            proposedFix: 'Add required field validation before form submission',
          });
        }
      });
    });
  });

  test.describe('READ Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test entry first
      await page.goto('/entries/new');
      const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      await titleField.fill(testEntryTitle);

      const contentEditor = page.locator('[contenteditable="true"], textarea[name="content"]').first();
      if (await contentEditor.isVisible()) {
        await contentEditor.fill('Test content for READ operations');
      }

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Extract ID if available
      const url = page.url();
      const idMatch = url.match(/\/entries\/([^\/]+)$/);
      if (idMatch) {
        testEntryId = idMatch[1];
      }
    });

    test('should display entry in index list', async ({ page }) => {
      await page.goto('/entries');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Look for the test entry in the list
      await test.step('Find entry in list', async () => {
        const entryLink = page.locator(`a:has-text("${testEntryTitle}"), [data-testid="entry-title"]:has-text("${testEntryTitle}")`).first();

        if (await entryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Entry found - good!
        } else {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Read',
            severity: 'High',
            description: 'Newly created entry not visible in index list',
            stepsToReproduce: [
              'Create a new entry',
              'Navigate to /entries',
              'Look for the created entry',
            ],
            expectedBehavior: 'Created entry should appear in the list',
            actualBehavior: 'Entry not found in index list',
            proposedFix: 'Ensure entries are properly fetched and rendered in index view',
          });
        }
      });

      // Check for pagination/sorting if present
      await test.step('Check pagination and sorting', async () => {
        const paginationControls = page.locator('[role="navigation"], .pagination, button:has-text("Next"), button:has-text("Previous")');
        if (await paginationControls.isVisible().catch(() => false)) {
          // Try clicking pagination to ensure it works
          const nextButton = page.locator('button:has-text("Next")').first();
          if (await nextButton.isEnabled().catch(() => false)) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');

            // Check for errors
            const hasError = await page.locator('[role="alert"], .error').isVisible().catch(() => false);
            if (hasError) {
              await issueLogger.logIssue({
                url: currentUrl,
                type: 'Functional',
                severity: 'Medium',
                description: 'Pagination controls cause errors',
                stepsToReproduce: [
                  'Go to /entries',
                  'Click pagination next button',
                ],
                expectedBehavior: 'Smooth pagination navigation',
                actualBehavior: 'Error occurs during pagination',
                proposedFix: 'Fix pagination logic',
              });
            }
          }
        }
      });
    });

    test('should display entry details on show page', async ({ page }) => {
      if (!testEntryId) {
        test.skip();
        return;
      }

      await page.goto(`/entries/${testEntryId}`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Check if entry data is displayed
      await test.step('Verify entry content display', async () => {
        const hasTitle = await page.locator(`h1:has-text("${testEntryTitle}"), h2:has-text("${testEntryTitle}")`).isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasTitle) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Read',
            severity: 'High',
            description: 'Entry title not displayed on detail page',
            stepsToReproduce: [
              `Navigate to /entries/${testEntryId}`,
              'Look for entry title',
            ],
            expectedBehavior: 'Entry title should be prominently displayed',
            actualBehavior: 'Title not found on page',
            proposedFix: 'Ensure entry data is properly fetched and rendered',
          });
        }
      });

      // Check for edit/delete links
      await test.step('Verify action links', async () => {
        const editLink = page.locator('a:has-text("Edit"), button:has-text("Edit")').first();
        const deleteButton = page.locator('button:has-text("Delete"), a:has-text("Delete")').first();

        const hasEdit = await editLink.isVisible({ timeout: 2000 }).catch(() => false);
        const hasDelete = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (!hasEdit) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'UI/UX',
            severity: 'Low',
            description: 'Edit link/button not found on entry detail page',
            stepsToReproduce: [
              `Navigate to /entries/${testEntryId}`,
              'Look for Edit button/link',
            ],
            expectedBehavior: 'Edit action should be available',
            actualBehavior: 'Edit link not found',
            proposedFix: 'Add edit link/button to entry detail view',
          });
        }
      });
    });
  });

  test.describe('UPDATE Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test entry
      await page.goto('/entries/new');
      const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      await titleField.fill(testEntryTitle);

      const contentEditor = page.locator('[contenteditable="true"], textarea[name="content"]').first();
      if (await contentEditor.isVisible()) {
        await contentEditor.fill('Original content for UPDATE testing');
      }

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const idMatch = url.match(/\/entries\/([^\/]+)$/);
      if (idMatch) {
        testEntryId = idMatch[1];
      }
    });

    test('should update entry with valid changes', async ({ page }) => {
      if (!testEntryId) {
        test.skip();
        return;
      }

      // Navigate to edit page
      await page.goto(`/entries/${testEntryId}/edit`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const updatedTitle = `${testEntryTitle} (updated)`;

      // Update the entry
      await test.step('Modify entry data', async () => {
        const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        await expect(titleField).toBeVisible({ timeout: 5000 });
        await titleField.fill(updatedTitle);
      });

      // Submit update
      await test.step('Submit update', async () => {
        const submitButton = page.locator('button[type="submit"], button:has-text("Update"), button:has-text("Save")').first();
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      });

      // Verify update
      await test.step('Verify update success', async () => {
        // Should redirect away from edit page
        const newUrl = page.url();
        if (newUrl === currentUrl) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Update',
            severity: 'Medium',
            description: 'Update form does not redirect after submission',
            stepsToReproduce: [
              `Go to /entries/${testEntryId}/edit`,
              'Modify title',
              'Submit form',
            ],
            expectedBehavior: 'Should redirect to entry detail or index',
            actualBehavior: 'Stays on edit page',
            proposedFix: 'Add redirect after successful update',
          });
        }

        // Navigate to detail page to verify
        await page.goto(`/entries/${testEntryId}`);
        const hasUpdatedTitle = await page.locator(`text="${updatedTitle}"`).isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasUpdatedTitle) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Update',
            severity: 'Blocker',
            description: 'Entry update did not persist changes',
            stepsToReproduce: [
              `Edit entry at /entries/${testEntryId}/edit`,
              'Change title',
              'Submit',
              'View entry detail page',
            ],
            expectedBehavior: 'Updated data should be saved and displayed',
            actualBehavior: 'Changes not persisted',
            proposedFix: 'Fix entry update logic in backend',
          });
        }
      });
    });

    test('should show validation errors on invalid update', async ({ page }) => {
      if (!testEntryId) {
        test.skip();
        return;
      }

      await page.goto(`/entries/${testEntryId}/edit`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Clear required field and try to submit
      await test.step('Submit invalid data', async () => {
        const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        await titleField.fill('');

        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        await page.waitForTimeout(1000);
      });

      // Check for validation
      await test.step('Verify validation', async () => {
        const validationMessages = page.locator('[role="alert"], .error, .text-red-500');
        const count = await validationMessages.count();

        if (count === 0) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Update',
            severity: 'Medium',
            description: 'No validation messages for invalid update data',
            stepsToReproduce: [
              `Go to /entries/${testEntryId}/edit`,
              'Clear title field',
              'Submit form',
            ],
            expectedBehavior: 'Validation error should be shown',
            actualBehavior: 'No validation feedback',
            proposedFix: 'Add validation to update form',
          });
        }
      });
    });
  });

  test.describe('DELETE Operations', () => {
    let entryToDelete: string;

    test.beforeEach(async ({ page }) => {
      // Create a test entry to delete
      await page.goto('/entries/new');
      const deleteTestTitle = `DELETE Test ${Date.now()}`;

      const titleField = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      await titleField.fill(deleteTestTitle);

      const contentEditor = page.locator('[contenteditable="true"], textarea[name="content"]').first();
      if (await contentEditor.isVisible()) {
        await contentEditor.fill('This entry will be deleted');
      }

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const idMatch = url.match(/\/entries\/([^\/]+)$/);
      if (idMatch) {
        entryToDelete = idMatch[1];
      }
    });

    test('should delete entry successfully', async ({ page }) => {
      if (!entryToDelete) {
        test.skip();
        return;
      }

      await page.goto(`/entries/${entryToDelete}`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Find and click delete button
      await test.step('Trigger delete', async () => {
        const deleteButton = page.locator('button:has-text("Delete"), a:has-text("Delete")').first();
        const isVisible = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!isVisible) {
          await issueLogger.logIssue({
            url: currentUrl,
            type: 'CRUD',
            operation: 'Delete',
            severity: 'Medium',
            description: 'Delete button not found on entry page',
            stepsToReproduce: [
              `Navigate to /entries/${entryToDelete}`,
              'Look for delete button',
            ],
            expectedBehavior: 'Delete option should be available',
            actualBehavior: 'No delete button found',
            proposedFix: 'Add delete button to entry detail view',
          });
          return;
        }

        await deleteButton.click();

        // Handle confirmation dialog if present
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });

        await page.waitForLoadState('networkidle');
      });

      // Verify deletion
      await test.step('Verify deletion', async () => {
        // Try to navigate to deleted entry
        await page.goto(`/entries/${entryToDelete}`);
        await page.waitForLoadState('networkidle');

        // Should show 404 or error, not the entry
        const stillExists = await page.locator(`h1, h2`).filter({ hasText: 'DELETE Test' }).isVisible({ timeout: 3000 }).catch(() => false);

        if (stillExists) {
          await issueLogger.logIssue({
            url: `/entries/${entryToDelete}`,
            type: 'CRUD',
            operation: 'Delete',
            severity: 'Blocker',
            description: 'Entry still accessible after deletion',
            stepsToReproduce: [
              `Go to /entries/${entryToDelete}`,
              'Click delete button',
              'Navigate back to entry URL',
            ],
            expectedBehavior: 'Entry should return 404 or not found error',
            actualBehavior: 'Entry still displays',
            proposedFix: 'Fix delete operation in backend',
          });
        }
      });
    });
  });
});
