import { test, expect } from "@playwright/test";

test.describe("Admin authenticated flows", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated admin session
    await page.route("**/api/auth/session", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user_admin",
            email: "admin@hireloop.io",
            name: "Admin User",
            role: "admin",
            org_id: "org_test",
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });

    // Mock org membership
    await page.route("**/api/user/permissions", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "admin", loading: false }),
      });
    });
  });

  test("admin can access API keys page and create key", async ({ page }) => {
    await page.goto("/admin/api-keys");
    await page.waitForLoadState("networkidle");

    // Should show the page (not redirect)
    await expect(page.locator("h2:has-text('API Keys')")).toBeVisible();

    // Click create key
    await page.click('button:has-text("Create API Key")');
    await expect(page.locator('h2:has-text("Create API Key")')).toBeVisible();

    // Fill form
    await page.fill('input[name="name"]', "Test Key");
    await page.click('button:has-text("Create")');

    // Should show success with key
    await expect(page.locator("text=Key created")).toBeVisible({ timeout: 5000 });
  });

  test("admin can access webhooks page and create subscription", async ({ page }) => {
    await page.goto("/admin/webhooks");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h2:has-text('Webhooks')")).toBeVisible();

    await page.click('button:has-text("Add Webhook")');
    await expect(page.locator('h2:has-text("Create Webhook")')).toBeVisible();

    await page.fill('input[name="url"]', "https://example.com/webhook");
    await page.check('input[value="application.created"]');
    await page.click('button:has-text("Create")');

    await expect(page.locator("text=Webhook created")).toBeVisible({ timeout: 5000 });
  });

  test("admin can access settings and connect calendar", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");

    // Navigate to integrations tab
    await page.click('button[role="tab"]:has-text("Integrations")');
    await expect(page.locator("text=Calendar Integration")).toBeVisible();

    // Google connect button should be present
    await expect(page.locator('button:has-text("Connect Google Calendar")')).toBeVisible();
  });

  test("dashboard shows animated stats and activity feed", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Animated stat cards
    await expect(page.locator('[data-testid="animated-stat"]').first()).toBeVisible();

    // Glance bar
    await expect(page.locator('[data-testid="glance-bar"]')).toBeVisible();

    // Activity feed
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
  });
});

test.describe("Role-based access control", () => {
  test("viewer redirected from admin-only pages", async ({ page }) => {
    await page.route("**/api/user/permissions", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "viewer", loading: false }),
      });
    });

    await page.goto("/admin/api-keys");
    await page.waitForLoadState("networkidle");

    // Should redirect or show access denied
    const url = page.url();
    expect(url).not.toContain("/admin/api-keys");
  });

  test("recruiter can access pipeline but not settings", async ({ page }) => {
    await page.route("**/api/user/permissions", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "recruiter", loading: false }),
      });
    });

    // Pipeline should be accessible
    await page.goto("/admin/pipeline");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h2:has-text('Pipeline')")).toBeVisible();

    // Settings should redirect
    await page.goto("/admin/settings");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toContain("/admin/settings");
  });
});

test.describe("Candidate self-scheduling flow", () => {
  test("candidate can view available slots and book", async ({ page }) => {
    await page.goto("/schedule/valid-token-123");
    await page.waitForLoadState("networkidle");

    // Should show scheduling page
    await expect(page.locator("h1:has-text('Schedule Your Interview')")).toBeVisible();

    // Should show available slots
    await expect(page.locator('[data-testid="slot-card"]').first()).toBeVisible();

    // Click a slot
    await page.click('[data-testid="slot-card"] >> nth=0');
    await expect(page.locator("text=Confirm Booking")).toBeVisible();
  });
});