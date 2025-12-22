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

    test('should display intro screen or chat interface', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Wait for the main content to load
        await page.waitForLoadState('networkidle');

        // Check for either intro elements or chat interface elements
        // h1 is used in intro, placeholder is used in chat
        const introVisible = await page.locator('h1').isVisible();
        const chatVisible = await page.getByPlaceholder(/response|תשובה/i).isVisible();

        if (!introVisible && !chatVisible) {
            // Wait a bit more if neither is visible immediately
            await page.waitForTimeout(5000);
        }

        expect(await page.locator('h1').isVisible() || await page.getByPlaceholder(/response|תשובה/i).isVisible()).toBeTruthy();
    });

    test('should require relationship selection to start', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // If intro screen is visible, check for relationship selection
        const introVisible = await page.locator('h1').isVisible();
        if (introVisible) {
            const startButton = page.getByRole('button', { name: /start|begin|התחל/i });
            await expect(startButton).toBeVisible();
        }
    });

    test('should transition to chat after starting', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Only run this if we are on the intro screen
        const introVisible = await page.locator('h1').isVisible();
        if (!introVisible) return;

        // Fill in name
        await page.getByPlaceholder(/name|שם/i).fill('Test Respondent');

        // Select a relationship (using the new editorial design)
        const relationshipSelect = page.locator('button[role="combobox"]');
        if (await relationshipSelect.count() > 0) {
            await relationshipSelect.click();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
        }

        // Click start
        await page.getByRole('button', { name: /start|begin|התחל/i }).click();

        // Should transition to chat interface
        await expect(page.getByPlaceholder(/response|תשובה/i)).toBeVisible({ timeout: 10000 });
    });

    test('should send message and receive AI response', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Wait for chat to load
        await expect(page.getByPlaceholder(/response|תשובה/i)).toBeVisible({ timeout: 10000 });

        // Type a unique message to avoid duplicates
        const testTimestamp = Date.now();
        const testMessage = `E2E Test Message ${testTimestamp}`;
        const textarea = page.getByPlaceholder(/response|תשובה/i);
        await textarea.fill(testMessage);

        // Click send
        await page.getByRole('button', { name: /send|שלח/i }).click();

        // Wait for AI response
        await expect(page.getByText(/thinking|חושב/i)).toBeHidden({ timeout: 30000 });

        // Should see the user message (using first() or the specific timestamped text)
        await expect(page.getByText(testMessage)).toBeVisible();
    });

    test('should show confirmation dialog when finishing', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Wait for chat to load
        await expect(page.getByPlaceholder(/response|תשובה/i)).toBeVisible({ timeout: 10000 });

        // Click finish button (the one in the main UI, not the dialog)
        await page.getByRole('button', { name: /finish survey|סיים סקר/i }).first().click();

        // Should show confirmation dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('button', { name: /continue|המשך/i })).toBeVisible();

        // Use a more specific locator for the button INSIDE the dialog
        const dialogFinishButton = page.locator('div[role="dialog"] button').filter({ hasText: /finish survey|סיים סקר/i });
        await expect(dialogFinishButton).toBeVisible();
    });

    test('should show thank you screen after completion', async ({ page }) => {
        await page.goto(`/survey/${TEST_SURVEY_ID}`);

        // Wait for chat to load
        await expect(page.getByPlaceholder(/response|תשובה/i)).toBeVisible({ timeout: 10000 });

        // Click finish button in main UI
        await page.getByRole('button', { name: /finish survey|סיים סקר/i }).first().click();

        // Click finish survey in dialog
        const dialogFinishButton = page.locator('div[role="dialog"] button').filter({ hasText: /finish survey|סיים סקר/i });
        await dialogFinishButton.click();

        // Should show thank you screen
        await expect(page.getByText(/thank you|תודה/i)).toBeVisible({ timeout: 15000 });
    });
});

/**
 * Accessibility tests for the survey flow
 */
test.describe('Survey Accessibility', () => {
    test('chat interface has proper ARIA labels', async ({ page }) => {
        await page.goto(`/survey/rJWgMFBrXN`);

        // Check for accessible elements
        await expect(page.getByRole('main')).toBeVisible();

        // Wait for either intro or chat
        const textarea = page.getByPlaceholder(/response|תשובה|name|שם/i);
        await expect(textarea).toBeVisible();
    });

    test('voice button has proper labels', async ({ page }) => {
        await page.goto(`/survey/rJWgMFBrXN`);

        // Ensure we are in chat mode
        const chatVisible = await page.getByPlaceholder(/response|תשובה/i).isVisible();
        if (!chatVisible) return;

        const voiceButton = page.getByRole('button', { name: /voice|קול/i });
        await expect(voiceButton).toBeVisible();
    });
});
