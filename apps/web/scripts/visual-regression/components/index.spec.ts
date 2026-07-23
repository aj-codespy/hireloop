import { test, expect } from "@playwright/test";

test.describe("Visual Regression — Landing & Home", () => {
  test("home page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await expect(page.locator("body")).toHaveScreenshot("landing/home-desktop.png", {
      animations: "disabled",
    });
  });

  test("home page — tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("body")).toHaveScreenshot("landing/home-tablet.png", {
      animations: "disabled",
    });
  });

  test("home page — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toHaveScreenshot("landing/home-mobile.png", {
      animations: "disabled",
    });
  });
});

test.describe("Visual Regression — Auth Pages", () => {
  test("login page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/login");
    await expect(page.locator("body")).toHaveScreenshot("auth/login-desktop.png", {
      animations: "disabled",
    });
  });

  test("login page — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.locator("body")).toHaveScreenshot("auth/login-mobile.png", {
      animations: "disabled",
    });
  });

  test("admin login — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/login");
    await expect(page.locator("body")).toHaveScreenshot("auth/admin-login-desktop.png", {
      animations: "disabled",
    });
  });

  test("admin login — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin/login");
    await expect(page.locator("body")).toHaveScreenshot("auth/admin-login-mobile.png", {
      animations: "disabled",
    });
  });

  test("signup page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/signup");
    await expect(page.locator("body")).toHaveScreenshot("auth/signup-desktop.png", {
      animations: "disabled",
    });
  });

  test("candidate login — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/candidate/login");
    await expect(page.locator("body")).toHaveScreenshot("auth/candidate-login-desktop.png", {
      animations: "disabled",
    });
  });
});

test.describe("Visual Regression — Admin Dashboard", () => {
  test("welcome page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/welcome");
    await expect(page.locator("body")).toHaveScreenshot("admin/welcome-desktop.png", {
      animations: "disabled",
    });
  });

  test("welcome page — mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin/welcome");
    await expect(page.locator("body")).toHaveScreenshot("admin/welcome-mobile.png", {
      animations: "disabled",
    });
  });

  test("candidates page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/candidates");
    await expect(page.locator("body")).toHaveScreenshot("admin/candidates-desktop.png", {
      animations: "disabled",
    });
  });

  test("jobs page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/jobs");
    await expect(page.locator("body")).toHaveScreenshot("admin/jobs-desktop.png", {
      animations: "disabled",
    });
  });

  test("reports page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/reports");
    await expect(page.locator("body")).toHaveScreenshot("admin/reports-desktop.png", {
      animations: "disabled",
    });
  });

  test("scheduling page — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/scheduling");
    await expect(page.locator("body")).toHaveScreenshot("admin/scheduling-desktop.png", {
      animations: "disabled",
    });
  });
});

test.describe("Visual Regression — Admin Content", () => {
  test("job creation form — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/jobs/new");
    await expect(page.locator("body")).toHaveScreenshot("forms/job-creation-desktop.png", {
      animations: "disabled",
    });
  });
});
