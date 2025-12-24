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
  await page.goto("/admin");

  if (!page.url().includes("/admin/login")) {
    return;
  }

  await expect(page.getByLabel(/email/i)).toBeVisible();
  await page.getByLabel(/email/i).fill(credentials.email);
  await page.getByLabel(/password/i).fill(credentials.password);

  await page
    .locator("form")
    .getByRole("button", { name: /sign in/i })
    .click();

  await page.waitForURL(/\/admin(\/)?$/);
}
