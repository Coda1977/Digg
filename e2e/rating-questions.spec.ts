import { test, expect } from "@playwright/test";
import { getAdminCredentials, loginAsAdmin } from "./utils/admin";

test.describe("Rating Questions", () => {
  const adminCredentials = getAdminCredentials();
  test.skip(!adminCredentials, "Admin credentials required");

  // Increase timeout for this comprehensive test
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, adminCredentials!);
  });

  test("end-to-end rating question workflow", async ({ page, context }) => {
    const timestamp = Date.now();

    // Create template with rating question
    await page.goto("/admin/templates/new");
    await page.locator("#name").fill(`Rating Test ${timestamp}`);
    await page.locator("#description").fill("E2E test template");

    // Select rating question type
    await page.getByRole("radio", { name: /rating scale/i }).first().click();
    await expect(page.getByText(/rating scale configuration/i)).toBeVisible();

    // Scale is already 1-10 by default, fill labels
    await page.getByPlaceholder(/poor, disagree, not at all/i).fill("Poor");
    await page.getByPlaceholder(/excellent, agree, extremely well/i).fill("Excellent");

    // Fill the question text
    await page.getByPlaceholder(/enter the question/i).first().fill("How satisfied are you with our service?");

    // Add a relationship option
    await page.getByPlaceholder(/e\.g\..*manager/i).first().fill("Customer");

    await page.getByRole("button", { name: /create template/i }).click();
    // Wait for navigation away from template creation page
    await page.waitForURL(/\/admin(\/)?$/, { timeout: 30000 });

    // Create project
    await page.goto("/admin/projects/new");
    await page.waitForLoadState("networkidle");

    // Select the template we just created (it's a card/radio button, need to scroll to find it)
    const templateCard = page.getByText(`Rating Test ${timestamp}`);
    await templateCard.scrollIntoViewIfNeeded();
    await templateCard.click();

    // Fill project details
    await page.locator("#subjectName").fill(`Subject ${timestamp}`);
    await page.locator("#subjectRole").fill("Service Provider");
    await page.locator("#name").fill(`Project ${timestamp}`);
    await page.getByRole("button", { name: /create project/i }).click();
    // Wait for redirect to project details page (not /new)
    await page.waitForURL(/\/admin\/projects\/(?!new)[^/]+$/, { timeout: 30000 });

    const projectId = page.url().split("/").pop();

    // Take survey
    const respondent = await context.newPage();
    await respondent.goto(`${new URL(page.url()).origin}/p/${projectId}`);
    await respondent.waitForURL(/\/survey\//);

    // Fill name and select relationship
    await respondent.getByPlaceholder(/your name/i).fill(`Respondent ${timestamp}`);
    await respondent.getByRole("button", { name: /customer/i }).click();
    await respondent.getByRole("button", { name: /begin survey/i }).click();

    await expect(respondent.getByText(/how satisfied are you/i)).toBeVisible({ timeout: 10000 });

    // Verify rating UI
    const radiogroup = respondent.getByRole("radiogroup", { name: /select rating/i });
    await expect(radiogroup).toBeVisible();
    await expect(respondent.getByText("Poor")).toBeVisible();
    await expect(respondent.getByText("Excellent")).toBeVisible();
    expect(await respondent.getByRole("radio").all()).toHaveLength(10);

    // Submit rating
    await respondent.getByRole("radio", { name: /rating 8/i }).click();
    await expect(respondent.getByPlaceholder(/share your thoughts|שתף את מחשבותיך/i)).toBeVisible({ timeout: 15000 });

    // Complete survey - answer follow-up then finish
    await respondent.getByPlaceholder(/share your thoughts/i).fill("Great service!");
    await respondent.getByRole("button", { name: /send/i }).click();

    // Wait for AI follow-up, then finish survey
    await respondent.waitForTimeout(2000);
    await respondent.getByText(/finish survey/i).click();

    // Handle optional confirmation dialog if it appears
    const dialog = respondent.getByRole("dialog");
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole("button", { name: /finish survey/i }).click();
    }

    // Wait for thank you page
    await expect(respondent.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
    await respondent.close();

    // Verify analysis
    await page.goto(`/admin/projects/${projectId}/analysis`);
    await page.waitForLoadState("networkidle");

    // Expand raw feedback section
    await page.getByRole("button", { name: /show all/i }).click();

    // Verify rating display - look for "AVERAGE RATING" and the value "8.0"
    await expect(page.getByText(/average rating/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("8.0")).toBeVisible();
  });
});
