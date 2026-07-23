import { test, expect } from '@playwright/test';

/**
 * Auth component visual regression tests
 * Covers login, signup, and password reset scenarios
 */

/**
 * Visual regression test for authentication forms
 * Tests across multiple viewport sizes to ensure mobile responsiveness
 */

test.describe('Visual Regression - Auth Forms', () => {
  // Desktop viewport (1280x720)
  test('login form - desktop', async ({ page }) => {
    await page.goto('/candidate/login');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/login-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('signup form - desktop', async ({ page }) => {
    await page.goto('/candidate/signup');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/signup-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('password reset form - desktop', async ({ page }) => {
    await page.goto('/candidate/forgot-password');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/password-reset-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  // Tablet viewport (768x1024)
  test('login form - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/candidate/login');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/login-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('signup form - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/candidate/signup');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/signup-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // Mobile viewport (375x667)
  test('login form - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/candidate/login');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/login-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('signup form - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/candidate/signup');
    await expect(page.locator('body')).toHaveScreenshot('auth/forms/signup-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

/**
 * Visual regression test for authentication state changes
 * Tests form validation, submission states, and error conditions
 */

test.describe('Visual Regression - Auth State Changes', () => {
  test('form validation - email field error', async ({ page }) => {
    await page.goto('/candidate/signup');
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.focus('[data-testid="email"]');
    await expect(page.locator('body')).toHaveScreenshot('auth/states/email-error.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('form submission loading state', async ({ page }) => {
    await page.goto('/candidate/login');
    
    // Enter credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('body')).toHaveScreenshot('auth/states/loading-state.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 10000,
    });
  });

  test('form validation - password requirements', async ({ page }) => {
    await page.goto('/candidate/signup');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'short');
    await page.focus('[data-testid="password"]');
    await expect(page.locator('body')).toHaveScreenshot('auth/states/password-requirements.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

/**
 * Visual regression test for social authentication
 */

test.describe('Visual Regression - Social Auth', () => {
  test('social login buttons - desktop', async ({ page }) => {
    await page.goto('/candidate/login');
    await expect(page.locator('body')).toHaveScreenshot('auth/social/social-buttons-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      viewport: { width: 1280, height: 720 },
    });
  });

  test('social login buttons - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/candidate/login');
    await expect(page.locator('body')).toHaveScreenshot('auth/social/social-buttons-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

/**
 * Visual regression test for multi-step auth forms
 */

test.describe('Visual Regression - Multi-Step Auth', () => {
  test('multi-step signup - step 1', async ({ page }) => {
    await page.goto('/candidate/signup');
    await expect(page.locator('body')).toHaveScreenshot('auth/multi-step/step-1.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

export default {};
