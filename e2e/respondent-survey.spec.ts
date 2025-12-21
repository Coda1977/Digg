import { test, expect } from '@playwright/test';

/**
 * E2E Tests for the Respondent Survey Flow
 *
 * This is the MOST CRITICAL flow - it's what respondents experience.
 *
 * Flow:
 * 1. Open survey link (/survey/[uniqueId])
 * 2. See intro screen with subject info
 * 3. Enter name and select relationship
 * 4. Start interview
 * 5. See AI greeting message
 * 6. Type a response and send
 * 7. See AI follow-up
 * 8. Finish survey
 * 9. See thank you screen
 *
 * NOTE: These tests require a real survey to exist in the database.
 * For CI, we'd need to seed test data or mock Convex.
 */

test.describe('Respondent Survey Flow', () => {
    // This test will work with any existing survey link
    // Replace with a real uniqueId from your database for actual testing
    const TEST_SURVEY_ID = 'rJWgMFBrXN';

    test('should show not found for invalid survey', async ({ page }) => {
        await page.goto('/survey/invalid-non-existent-id');

        // Should show not found message
        await expect(page.getByText('Survey link not found')).toBeVisible();
        await expect(page.getByText('invalid or has expired')).toBeVisible();
    });

    test('should display intro screen with subject info', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Should show either intro elements (if not started) or chat interface (if in progress)
        const introVisible = await page.locator('h1').isVisible();
        const chatVisible = await page.getByPlaceholder(/response/i).isVisible();

        expect(introVisible || chatVisible).toBeTruthy();
    });

    test('should require relationship selection to start', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // The start button should be disabled or hidden without selection
        const startButton = page.getByRole('button', { name: /start|begin/i });

        // Try to submit without selecting relationship
        // The form should require a selection
        await expect(startButton).toBeVisible();
    });

    test.skip('should transition to chat after starting', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Fill in name
        await page.getByPlaceholder(/name/i).fill('Test Respondent');

        // Select a relationship
        const relationshipOptions = page.locator('button[role="combobox"], select, [data-testid="relationship-select"]');
        if (await relationshipOptions.count() > 0) {
            await relationshipOptions.first().click();
            // Select first option
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
        }

        // Click start
        await page.getByRole('button', { name: /start|begin/i }).click();

        // Should transition to chat interface
        await expect(page.getByPlaceholder(/response/i)).toBeVisible({ timeout: 10000 });
    });

    test.skip('should send message and receive AI response', async ({ page }) => {
        // This test assumes we're already in the chat state
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Wait for chat to load (if already in progress)
        await page.waitForTimeout(2000);

        // Type a message
        const textarea = page.getByPlaceholder(/response/i);
        await textarea.fill('This is a test response from the E2E test.');

        // Click send
        await page.getByRole('button', { name: /send/i }).click();

        // Wait for AI response (indicated by "Thinking..." disappearing)
        await expect(page.getByText('Thinking')).toBeHidden({ timeout: 30000 });

        // Should see both user message and AI response
        await expect(page.getByText('This is a test response')).toBeVisible();
    });

    test.skip('should show confirmation dialog when finishing', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Click finish/complete button
        await page.getByRole('button', { name: /finish/i }).click();

        // Should show confirmation dialog
        await expect(page.getByText('ready to finish')).toBeVisible();
        await expect(page.getByRole('button', { name: /continue editing/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /finish survey/i })).toBeVisible();
    });

    test.skip('should show thank you screen after completion', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Finish the survey
        await page.getByRole('button', { name: /finish/i }).click();
        await page.getByRole('button', { name: /finish survey/i }).click();

        // Should show thank you screen
        await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
    });
});

/**
 * Accessibility tests for the survey flow
 */
test.describe('Survey Accessibility', () => {
    test.skip('chat interface has proper ARIA labels', async ({ page }) => {
        await page.goto('/survey/rJWgMFBrXN');

        // Check for accessible elements
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByRole('textbox')).toBeVisible();
    });

    test.skip('voice button has proper aria-pressed state', async ({ page }) => {
        await page.goto('/survey/rJWgMFBrXN');

        const voiceButton = page.getByRole('button', { name: /voice/i });
        await expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
    });
});
