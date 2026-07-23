import { test, expect } from '@playwright/test';

/**
 * Interview component visual regression tests
 * Covers interview flow components across different viewports
 */

test.describe('Visual Regression - Interview Components', () => {
  test('interview questions - desktop', async ({ page }) => {
    await page.goto('/apply/[jobId]');
    await expect(page.locator('body')).toHaveScreenshot('interview/questions-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('interview questions - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/apply/[jobId]');
    await expect(page.locator('body')).toHaveScreenshot('interview/questions-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('interview questions - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apply/[jobId]');
    await expect(page.locator('body')).toHaveScreenshot('interview/questions-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('interview interface - desktop', async ({ page }) => {
    await page.goto('/candidate/[token]');
    await expect(page.locator('body')).toHaveScreenshot('interview/interface-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });
});

test.describe('Visual Regression - Admin Dashboard Components', () => {
  test('admin dashboard - desktop', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toHaveScreenshot('admin/dashboard-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('admin dashboard - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toHaveScreenshot('admin/dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('admin dashboard - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toHaveScreenshot('admin/dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('candidates page - desktop', async ({ page }) => {
    await page.goto('/admin/candidates');
    await expect(page.locator('body')).toHaveScreenshot('admin/candidates-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });
});

test.describe('Visual Regression - Form Components', () => {
  test('job creation form - desktop', async ({ page }) => {
    await page.goto('/admin/jobs/new');
    await expect(page.locator('body')).toHaveScreenshot('forms/job-creation-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('job creation form - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/jobs/new');
    await expect(page.locator('body')).toHaveScreenshot('forms/job-creation-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('job creation form - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/jobs/new');
    await expect(page.locator('body')).toHaveScreenshot('forms/job-creation-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Component Library Testing', () => {
  test('ui cards and panels - desktop', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toHaveScreenshot('components/ui-cards-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('ui cards and panels - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toHaveScreenshot('components/ui-cards-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Interview Flow Interface', () => {
  test('interview phase - desktop', async ({ page }) => {
    await page.goto('/candidate/[token]');
    await expect(page.locator('body')).toHaveScreenshot('interview/phase-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('interview phase - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/candidate/[token]');
    await expect(page.locator('body')).toHaveScreenshot('interview/phase-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
test.describe('Visual Regression - Onboarding Components', () => {
  test('onboarding welcome page - desktop', async ({ page }) => {
    await page.goto('/admin/welcome');
    await expect(page.locator('body')).toHaveScreenshot('onboarding/welcome-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('onboarding welcome page - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/welcome');
    await expect(page.locator('body')).toHaveScreenshot('onboarding/welcome-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Error Handling UI', () => {
  test('error message display - desktop', async ({ page }) => {
    await page.goto('/candidate/login');
    
    // Trigger error state
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.fill('[data-testid="password"]', 'wrong');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('body')).toHaveScreenshot('error/display-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });
});

export default {};
