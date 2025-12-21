import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Project Creation Flow (Admin)
 *
 * Flow:
 * 1. Login as admin
 * 2. Navigate to /admin/projects/new
 * 3. Select a template
 * 4. Fill in subject info
 * 5. Submit
 * 6. Verify project page with share link
 *
 * NOTE: These tests require admin authentication and existing templates.
 */

test.describe('Project Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin/projects/new');
    });

    test.skip('should display project creation form', async ({ page }) => {
        // Check for form sections
        await expect(page.getByText('01 · Template')).toBeVisible();
        await expect(page.getByText('02 · Subject')).toBeVisible();
        await expect(page.getByText('03 · Project')).toBeVisible();
    });

    test.skip('should list available templates', async ({ page }) => {
        // Should show template options
        const templateCards = page.locator('[data-testid="template-card"], .template-option, button:has-text("Feedback")');
        await expect(templateCards.first()).toBeVisible();
    });

    test.skip('should require template selection', async ({ page }) => {
        // Fill in other fields without selecting template
        await page.getByLabel(/subject name/i).fill('Test Subject');

        // Try to submit
        await page.getByRole('button', { name: /create/i }).click();

        // Should show validation error
        await expect(page.getByRole('alert')).toBeVisible();
    });

    test.skip('should create project successfully', async ({ page }) => {
        // Select first template
        const templateOption = page.locator('button:has-text("360")').first();
        if (await templateOption.isVisible()) {
            await templateOption.click();
        }

        // Fill in subject info
        await page.getByLabel(/subject name/i).fill('E2E Test Subject');
        await page.getByLabel(/role/i).fill('Test Role');
        await page.getByLabel(/project name/i).fill('E2E Test Project');

        // Submit
        await page.getByRole('button', { name: /create/i }).click();

        // Should redirect to project page
        await expect(page).toHaveURL(/\/admin\/projects\//, { timeout: 10000 });
    });

    test.skip('should show share link after creation', async ({ page }) => {
        // Navigate to an existing project
        await page.goto('/admin/projects/test-project-id');

        // Should show share link
        await expect(page.getByText(/share/i)).toBeVisible();
        await expect(page.locator('input[readonly]')).toBeVisible();
    });
});

test.describe('Project Management', () => {
    test.skip('should list projects on admin dashboard', async ({ page }) => {
        await page.goto('/admin');

        // Should show projects list
        await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    });

    test.skip('should filter projects by status', async ({ page }) => {
        await page.goto('/admin');

        // Look for status filter/tabs
        const activeTab = page.getByRole('tab', { name: /active/i });
        const closedTab = page.getByRole('tab', { name: /closed/i });

        if (await activeTab.isVisible()) {
            await closedTab.click();
            // Should filter to show only closed projects
            await expect(page).toHaveURL(/status=closed/);
        }
    });

    test.skip('should copy share link to clipboard', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        await page.goto('/admin/projects/test-project-id');

        // Click copy button
        await page.getByRole('button', { name: /copy/i }).click();

        // Should show copied confirmation
        await expect(page.getByText(/copied/i)).toBeVisible();
    });
});
