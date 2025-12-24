import { test, expect } from "@playwright/test";

import { getAdminCredentials, loginAsAdmin } from "./utils/admin";

const adminCredentials = getAdminCredentials();

test.describe("Project Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !adminCredentials,
      "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests."
    );
    await loginAsAdmin(page, adminCredentials!);
  });

  test("creates a project and shows the share link", async ({ page }) => {
    await page.goto("/admin/projects/new");

    const seedButton = page.getByRole("button", { name: /seed templates/i });
    if (await seedButton.isVisible()) {
      await seedButton.click();
    }

    const templateCards = page
      .locator('div[role="button"]')
      .filter({ has: page.locator("h3") });
    await expect(templateCards.first()).toBeVisible();
    await templateCards.first().click();

    const timestamp = Date.now();
    await page.locator("#subjectName").fill(`E2E Subject ${timestamp}`);
    await page.locator("#subjectRole").fill("Engineer");
    await page.locator("#name").fill(`E2E Project ${timestamp}`);

    await page.getByRole("button", { name: /create project/i }).click();

    await expect(page).toHaveURL(/\/admin\/projects\/[a-z0-9]+/i);
    await expect(page.getByText("Share Project")).toBeVisible();
    await expect(page.locator("input[readonly]")).toBeVisible();
  });
});
