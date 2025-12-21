import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Analytics Flow (Admin)
 *
 * Flow:
 * 1. Login as admin
 * 2. Open project with completed surveys
 * 3. Navigate to analysis page
 * 4. Click "Generate insights"
 * 5. Verify insights appear
 * 6. Test PDF download
 *
 * NOTE: These tests require admin authentication and a project with completed surveys.
 */

test.describe('Analytics Flow', () => {
    const TEST_PROJECT_ID = 'test-project-id'; // TODO: Replace with real ID

    test.skip('should navigate to analysis page from project', async ({ page }) => {
        await page.goto(`/admin/projects/${TEST_PROJECT_ID}`);

        // Click analysis link
        await page.getByRole('link', { name: /analysis/i }).click();

        // Should be on analysis page
        await expect(page).toHaveURL(/\/analysis/);
        await expect(page.getByText('Interviews & analysis')).toBeVisible();
    });

    test.skip('should show generate insights button when no analysis exists', async ({ page }) => {
        await page.goto(`/admin/projects/${TEST_PROJECT_ID}/analysis`);

        // Should show generate button
        await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
    });

    test.skip('should generate project insights', async ({ page }) => {
        await page.goto(`/admin/projects/${TEST_PROJECT_ID}/analysis`);

        // Click generate
        await page.getByRole('button', { name: /generate/i }).click();

        // Should show loading state
        await expect(page.getByText(/generating|analyzing/i)).toBeVisible();

        // Wait for insights to appear (this may take a while with real AI)
        await expect(page.getByText(/overview|themes|sentiment/i)).toBeVisible({ timeout: 60000 });
    });

    test.skip('should display analysis sections', async ({ page }) => {
        // Navigate to a project that already has analysis
        await page.goto(`/admin/projects/${TEST_PROJECT_ID}/analysis`);

        // Should show analysis sections
        await expect(page.getByText(/overview/i)).toBeVisible();
        await expect(page.getByText(/key themes/i)).toBeVisible();
        await expect(page.getByText(/praise/i)).toBeVisible();
        await expect(page.getByText(/improvement/i)).toBeVisible();
    });

    test.skip('should show segmented analysis tabs', async ({ page }) => {
        await page.goto(`/admin/projects/${TEST_PROJECT_ID}/analysis`);

        // Look for segment toggle/tabs
        const overallTab = page.getByRole('button', { name: /overall/i });
        const segmentedTab = page.getByRole('button', { name: /by relationship/i });

        await expect(overallTab).toBeVisible();
        await expect(segmentedTab).toBeVisible();
    });

    test.skip('should allow PDF download', async ({ page }) => {
        await page.goto(`/admin/projects/${TEST_PROJECT_ID}/analysis`);

        // Look for download button
        const downloadButton = page.getByRole('link', { name: /download|pdf/i });
        await expect(downloadButton).toBeVisible();
    });
});

test.describe('Individual Survey Analysis', () => {
    test.skip('should display survey transcript', async ({ page }) => {
        // Navigate to individual survey
        await page.goto('/admin/surveys/test-survey-id');

        // Should show transcript
        await expect(page.getByText(/transcript/i)).toBeVisible();
    });

    test.skip('should generate survey summary', async ({ page }) => {
        await page.goto('/admin/surveys/test-survey-id');

        // Click generate summary
        await page.getByRole('button', { name: /generate|summarize/i }).click();

        // Wait for summary
        await expect(page.getByText(/overview|summary/i)).toBeVisible({ timeout: 30000 });
    });

    test.skip('should flag survey for review', async ({ page }) => {
        await page.goto('/admin/surveys/test-survey-id');

        // Click flag button
        await page.getByRole('button', { name: /flag/i }).click();

        // Should show flag reason input or confirmation
        await expect(page.getByText(/flag|reason/i)).toBeVisible();
    });
});

test.describe('Analytics Accessibility', () => {
    test.skip('should have proper heading hierarchy', async ({ page }) => {
        await page.goto(`/admin/projects/test-project-id/analysis`);

        // Check for h1
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test.skip('should have accessible sentiment badges', async ({ page }) => {
        await page.goto(`/admin/projects/test-project-id/analysis`);

        // Sentiment indicators should be readable
        const badges = page.locator('[class*="badge"], [class*="sentiment"]');
        if (await badges.count() > 0) {
            await expect(badges.first()).toBeVisible();
        }
    });
});
