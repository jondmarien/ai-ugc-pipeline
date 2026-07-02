import { expect, test } from "@playwright/test";

const SAMPLE_POST = {
  renderDir: "2026-06-11_bluehammer",
  slug: "bluehammer",
  date: "2026-06-11",
  platform: "instagram",
  postType: "reel",
  mediaId: "ig1",
  url: "https://instagram.com/p/ig1",
  privacy: null,
  isAiGenerated: true,
  caption:
    "BlueHammer is a real red-team technique. Here's the defender takeaway.",
  hashtags: ["BlueHammer", "CyberSecurity"],
  publishedAt: 1749600000,
  insights: { views: 1200, reach: 900, saves: 12, shares: 3 },
  insightsError: null,
};

test("meta tab shows published posts from a stubbed API", async ({ page }) => {
  await page.route("**/api/meta/insights**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [SAMPLE_POST],
        error: null,
        fetchedAt: Date.now(),
      }),
    }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Meta", exact: true }).click();
  await expect(page.locator(".page-title")).toContainText("Meta");
  await expect(page.getByText("Instagram · Reel")).toBeVisible();
  await expect(page.getByText(/BlueHammer/)).toBeVisible();
});

test("meta tab shows a not-connected empty state when credentials are missing", async ({
  page,
}) => {
  await page.route("**/api/meta/insights**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        error:
          "No Meta credentials found — run `bun run publish:auth meta` in renderer/ first.",
        fetchedAt: null,
      }),
    }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Meta", exact: true }).click();
  await expect(page.getByText("META NOT CONNECTED YET")).toBeVisible();
});
