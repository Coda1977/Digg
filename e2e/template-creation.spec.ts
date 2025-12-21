import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Template Creation Flow (Admin)
 *
 * Flow:
 * 1. Login as admin
 * 2. Navigate to /admin/templates/new
 * 3. Fill in name, description
 * 4. Add questions
 * 5. Add relationships
 * 6. (Optional) Add persona
 * 7. Submit
 * 8. Verify redirect to templates list
 *
 * NOTE: These tests require admin authentication.
 * For CI, we'd need to handle auth or use a test user.
 */

test.describe('Template Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to admin templates page
        // In a real test, we'd need to handle authentication first
        await page.goto('/admin/templates/new');
    });

    test.skip('should display template creation form', async ({ page }) => {
        // Check for form sections
        await expect(page.getByText('01 · Details')).toBeVisible();
        await expect(page.getByText('02 · Questions')).toBeVisible();
        await expect(page.getByText('03 · Relationships')).toBeVisible();
        await expect(page.getByText('04 · Interviewer Persona')).toBeVisible();
    });

    test.skip('should show validation error for empty form', async ({ page }) => {
        // Try to submit empty form
        await page.getByRole('button', { name: /create template/i }).click();

        // Should show error
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page.getByText(/required/i)).toBeVisible();
    });

    test.skip('should add and remove questions', async ({ page }) => {
        // Click add question
        await page.getByRole('button', { name: /add question/i }).click();

        // Should have 2 question inputs now
        const questionInputs = page.locator('textarea[placeholder*="question"]');
        await expect(questionInputs).toHaveCount(2);

        // Remove second question (find the trash button)
        const removeButtons = page.locator('button[title="Remove question"]');
        await removeButtons.last().click();

        // Should have 1 question input now
        await expect(questionInputs).toHaveCount(1);
    });

    test.skip('should add and remove relationship options', async ({ page }) => {
        // Click add option
        await page.getByRole('button', { name: /add option/i }).click();

        // Should have 2 relationship inputs now
        const relationshipInputs = page.locator('input[placeholder*="Manager"]');
        await expect(relationshipInputs).toHaveCount(2);
    });

    test.skip('should create template successfully', async ({ page }) => {
        // Fill in details
        await page.getByLabel(/template name/i).fill('E2E Test Template');
        await page.locator('textarea').first().fill('This is a test template created by E2E tests');

        // Add a question
        const questionTextarea = page.locator('textarea[placeholder*="question"]').first();
        await questionTextarea.fill('What do you think about this test?');

        // Add a relationship
        const relationshipInput = page.locator('input[placeholder*="Manager"]').first();
        await relationshipInput.fill('Tester');

        // Submit
        await page.getByRole('button', { name: /create template/i }).click();

        // Should redirect to admin or templates list
        await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });
});

test.describe('Template Editing Flow', () => {
    test.skip('should load existing template data', async ({ page }) => {
        // Navigate to edit page for an existing template
        // This would need a real template ID
        await page.goto('/admin/templates/test-template-id/edit');

        // Form should be pre-filled
        await expect(page.getByLabel(/template name/i)).not.toBeEmpty();
    });

    test.skip('should save changes to template', async ({ page }) => {
        await page.goto('/admin/templates/test-template-id/edit');

        // Modify name
        const nameInput = page.getByLabel(/template name/i);
        await nameInput.clear();
        await nameInput.fill('Updated Template Name');

        // Save
        await page.getByRole('button', { name: /save/i }).click();

        // Should redirect
        await expect(page).toHaveURL(/\/admin\/templates/, { timeout: 10000 });
    });
});
