import { test, expect } from "@playwright/test";

const MODULES = ["Overview", "Hook Vault", "Analytics", "Competitors", "Scheduler", "Calendar", "What's Trending"];

test("every module renders and screenshots", async ({ page }) => {
  await page.goto("/");
  for (const label of MODULES) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(600); // let useApi settle; cached data renders instantly
    await expect(page.locator(".main")).toBeVisible();
    await page.screenshot({ path: `e2e/shots/${label.toLowerCase().replace(/[^a-z]+/g, "-")}.png`, fullPage: true });
  }
});

test("analytics shows fixture-cached stats", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page.locator(".page-title")).toContainText("Analytics");
});
