import { test, expect } from "@playwright/test";

import { getAdminCredentials, loginAsAdmin } from "./utils/admin";

const adminCredentials = getAdminCredentials();
const templateStamp = Date.now();
const templateName = `E2E Template ${templateStamp}`;
const updatedTemplateName = `E2E Template ${templateStamp} Updated`;

test.describe.serial("Template Creation and Editing", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !adminCredentials,
      "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests."
    );
    await loginAsAdmin(page, adminCredentials!);
  });

  test("creates a custom template", async ({ page }) => {
    await page.goto("/admin/templates/new");

    await page.locator("#name").fill(templateName);
    await page.locator("#description").fill(
      "E2E template for automated admin testing."
    );
    await page.getByLabel(/Question 1 text/i).fill(
      "What should we keep doing?"
    );
    await page.getByLabel(/Relationship option 1/i).fill("Peer");

    await page.getByRole("button", { name: /create template/i }).click();

    await expect(page).toHaveURL(/\/admin/);
    await page.goto("/admin/templates");
    await page.getByLabel(/search templates/i).fill(templateName);
    await expect(page.getByText(templateName)).toBeVisible();
  });

  test("edits the custom template", async ({ page }) => {
    await page.goto("/admin/templates");
    await page.getByLabel(/search templates/i).fill(templateName);
    await expect(page.getByText(templateName)).toBeVisible();

    await page.getByRole("button", { name: /^edit$/i }).click();
    await expect(page).toHaveURL(/\/admin\/templates\/.+\/edit/);

    await page.locator("#name").fill(updatedTemplateName);
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page).toHaveURL(/\/admin\/templates/);
    await page.getByLabel(/search templates/i).fill(updatedTemplateName);
    await expect(page.getByText(updatedTemplateName)).toBeVisible();
  });
});
