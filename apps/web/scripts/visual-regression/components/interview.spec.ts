import { test, expect } from "@playwright/test";

test.describe("Visual Regression — Interview Components", () => {
  test("interview flow page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/candidates");
    await expect(page.locator("body")).toHaveScreenshot("interview/candidates-desktop.png", {
      animations: "disabled",
    });
  });

  test("interview flow page — tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/admin/candidates");
    await expect(page.locator("body")).toHaveScreenshot("interview/candidates-tablet.png", {
      animations: "disabled",
    });
  });

  test("interview flow page — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin/candidates");
    await expect(page.locator("body")).toHaveScreenshot("interview/candidates-mobile.png", {
      animations: "disabled",
    });
  });
});

test.describe("Visual Regression — Dashboard Content", () => {
  test("admin page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin");
    await expect(page.locator("body")).toHaveScreenshot("admin/dashboard-desktop.png", {
      animations: "disabled",
    });
  });

  test("admin page — tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/admin");
    await expect(page.locator("body")).toHaveScreenshot("admin/dashboard-tablet.png", {
      animations: "disabled",
    });
  });

  test("admin page — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin");
    await expect(page.locator("body")).toHaveScreenshot("admin/dashboard-mobile.png", {
      animations: "disabled",
    });
  });
});
