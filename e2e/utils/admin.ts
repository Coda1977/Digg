import { expect, type Page } from "@playwright/test";

export type AdminCredentials = {
  email: string;
  password: string;
};

export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export async function loginAsAdmin(page: Page, credentials: AdminCredentials) {
  await page.goto("/admin/login");

  // Wait for page to settle
  await page.waitForLoadState("networkidle");

  console.log("On login page, attempting to log in...");

  // Wait for login form to be ready
  await expect(page.locator("#email")).toBeVisible({ timeout: 10000 });

  // Fill credentials using id selectors (more reliable)
  await page.locator("#email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);

  console.log("Credentials filled, clicking submit...");

  // Click submit button inside the form
  await page.locator("form").getByRole("button").click();

  // Wait for either success (redirect to /admin) or error message
  try {
    await page.waitForURL(/\/admin(\/)?$/, { timeout: 15000 });
    console.log("Login successful!");
  } catch {
    // Check for error message
    const errorText = await page.locator('[role="alert"]').textContent().catch(() => null);
    if (errorText) {
      throw new Error(`Login failed: ${errorText}`);
    }
    // Take screenshot for debugging
    await page.screenshot({ path: "login-debug.png" });
    throw new Error(`Login did not complete. Current URL: ${page.url()}`);
  }
}
