import { test, expect } from "@playwright/test";

import { getAdminCredentials, loginAsAdmin } from "./utils/admin";

const adminCredentials = getAdminCredentials();

const summaryResponse = {
  overview: "E2E summary overview",
  keyThemes: ["communication", "ownership"],
  sentiment: "positive",
  specificPraise: ["Clear collaborator"],
  areasForImprovement: ["More proactive updates"],
};

const analysisResponse = {
  summary: "E2E Analysis Summary",
  strengths: [
    {
      point: "Strong cross-team collaboration",
      quote: "Always ready to help",
      frequency: 1,
    },
  ],
  improvements: [
    {
      point: "Earlier risk escalation",
      action: "Share blockers sooner",
      priority: "medium",
    },
  ],
  coverage: {
    totalInterviews: 1,
    breakdown: {
      Peer: 1,
    },
  },
};

test.describe("Analytics Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !adminCredentials,
      "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin tests."
    );
    await loginAsAdmin(page, adminCredentials!);
  });

  test("generates insights and enables PDF download", async ({
    page,
    context,
  }) => {
    await context.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: "Thanks for sharing. Could you add an example?",
          questionId: null,
          questionText: null,
        }),
      });
    });

    await context.route("**/api/surveys/summarize", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(summaryResponse),
      });
    });

    await context.route("**/api/projects/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(analysisResponse),
      });
    });

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
    await page.locator("#subjectName").fill(`E2E Analyst ${timestamp}`);
    await page.locator("#subjectRole").fill("Product Manager");
    await page.locator("#name").fill(`E2E Insights ${timestamp}`);

    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/[a-z0-9]+/i);

    const projectUrl = new URL(page.url());
    const projectId = projectUrl.pathname.split("/").pop();
    if (!projectId) {
      throw new Error("Project ID was not found after creation.");
    }

    const respondent = await context.newPage();
    await respondent.goto(`${projectUrl.origin}/p/${projectId}`);
    await respondent.waitForURL(/\/survey\//);

    await respondent.getByLabel(/your relationship/i).selectOption({ index: 0 });
    await respondent
      .getByLabel(/your name/i)
      .fill(`E2E Respondent ${timestamp}`);
    await respondent.getByRole("button", { name: /begin interview/i }).click();

    await expect(
      respondent.getByPlaceholder(/your response/i)
    ).toBeVisible();
    await respondent.getByPlaceholder(/your response/i).fill(
      "E2E feedback message"
    );
    await respondent.getByRole("button", { name: /send/i }).click();

    await respondent
      .getByRole("button", { name: /finish survey/i })
      .first()
      .click();
    await respondent
      .getByRole("dialog")
      .getByRole("button", { name: /finish survey/i })
      .click();
    await expect(respondent.getByText(/thank you/i)).toBeVisible();
    await respondent.close();

    await page.goto(`/admin/projects/${projectId}/analysis`);
    await expect(page.getByText(/interviews & analysis/i)).toBeVisible();

    const summaryButton = page.getByRole("button", {
      name: /generate .* missing summaries/i,
    });
    if (await summaryButton.isVisible()) {
      await summaryButton.click();
      await expect(summaryButton).toBeHidden({ timeout: 20000 });
    }

    const generateInsightsButton = page.getByRole("button", {
      name: /generate insights/i,
    });
    await expect(generateInsightsButton).toBeEnabled();
    await generateInsightsButton.click();

    await expect(page.getByText("E2E Analysis Summary")).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.getByRole("link", { name: /download pdf/i })
    ).toBeVisible();
  });
});
