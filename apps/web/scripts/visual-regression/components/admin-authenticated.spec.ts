import { test, expect } from "@playwright/test";

// Smoke tests: verify pages load without server errors (status < 500)
// These tests do NOT require authentication or valid data.

test.describe("Admin page HTTP status checks", () => {
  test("admin dashboard returns 200 or 302", async ({ page }) => {
    const resp = await page.goto("/admin");
    expect(resp?.status()).toBeLessThanOrEqual(302);
  });

  test("admin API keys page returns 200 or 302", async ({ page }) => {
    const resp = await page.goto("/admin/api-keys");
    expect(resp?.status()).toBeLessThanOrEqual(302);
  });

  test("admin webhooks page returns 200 or 302", async ({ page }) => {
    const resp = await page.goto("/admin/webhooks");
    expect(resp?.status()).toBeLessThanOrEqual(302);
  });

  test("admin settings page returns 200 or 302", async ({ page }) => {
    const resp = await page.goto("/admin/settings");
    expect(resp?.status()).toBeLessThanOrEqual(302);
  });
});

test.describe("Public pages return 200", () => {
  test("landing page returns 200", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp?.status()).toBe(200);
  });

  test("login page returns 200", async ({ page }) => {
    const resp = await page.goto("/login");
    expect(resp?.status()).toBe(200);
  });

  test("admin login page returns 200", async ({ page }) => {
    const resp = await page.goto("/admin/login");
    expect(resp?.status()).toBe(200);
  });
});

test.describe("Auth pages return valid status", () => {
  test("signup page returns 200 or 302", async ({ page }) => {
    const resp = await page.goto("/auth/signup");
    expect(resp?.status()).toBeLessThanOrEqual(302);
  });
});

test.describe("Candidate scheduling page", () => {
  test("schedule page returns 200 or 302", async ({ page }) => {
    const resp = await page.goto("/schedule/test-token", {
      waitUntil: "commit",
    });
    expect(resp?.status()).toBeLessThanOrEqual(302);
  });
});