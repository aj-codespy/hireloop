import { test, expect } from "@playwright/test";

test.describe("Admin page basic smoke tests", () => {
  test("admin dashboard page loads without server error", async ({ page }) => {
    const resp = await page.goto("/admin");
    expect(resp?.status()).toBeLessThan(500);
  });

  test("admin API keys page loads without server error", async ({ page }) => {
    const resp = await page.goto("/admin/api-keys");
    expect(resp?.status()).toBeLessThan(500);
  });

  test("admin webhooks page loads without server error", async ({ page }) => {
    const resp = await page.goto("/admin/webhooks");
    expect(resp?.status()).toBeLessThan(500);
  });

  test("admin settings page loads without server error", async ({ page }) => {
    const resp = await page.goto("/admin/settings");
    expect(resp?.status()).toBeLessThan(500);
  });
});
