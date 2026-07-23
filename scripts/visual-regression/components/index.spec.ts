import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for HireLoop Components
 * 
 * These tests are designed to catch UI regressions early in the development cycle.
 * They use Playwright's expectScreenshot() matcher to compare against baseline snapshots.
 * 
 * Tests run across multiple viewport sizes to ensure consistent rendering across devices.
 */

test.describe('Visual Regression - Authentication Components', () => {
  test('auth forms - login page', async ({ page }) => {
    await page.goto('/candidate/login');
    await expect(page.locator('body')).toHaveScreenshot('auth/login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('auth forms - signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.locator('body')).toHaveScreenshot('auth/signup-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('auth forms - password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.locator('body')).toHaveScreenshot('auth/password-reset-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Interview Components', () => {
  test('interview flow - interview questions', async ({ page }) => {
    await page.goto('/apply/[jobId]');
    await expect(page.locator('body')).toHaveScreenshot('interview/interview-questions.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('interview flow - interview interface', async ({ page }) => {
    await page.goto('/candidate/[token]');
    await expect(page.locator('body')).toHaveScreenshot('interview/interview-interface.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Admin Dashboard', () => {
  test('admin dashboard - jobs overview', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('body')).toHaveScreenshot('admin/jobs-overview.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('admin dashboard - candidates page', async ({ page }) => {
    await page.goto('/admin/candidates');
    await expect(page.locator('body')).toHaveScreenshot('admin/candidates-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Form Components', () => {
  test('forms - job creation form', async ({ page }) => {
    await page.goto('/admin/jobs/new');
    await expect(page.locator('body')).toHaveScreenshot('forms/job-creation-form.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('forms - interview question setup', async ({ page }) => {
    await page.goto('/admin/jobs/[id]/questions');
    await expect(page.locator('body')).toHaveScreenshot('forms/interview-question-setup.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Component Library', () => {
  test('ui components - cards and panels', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.evaluate(() => {
      // Click to navigate to components section
      const element = document.querySelector('[data-testid="components-section"]');
      if (element) element.click();
    });
    await expect(page.locator('body')).toHaveScreenshot('components/ui-cards.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
test.describe('Visual Regression - Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ];

  viewports.forEach(viewport => {
    test(`responsive design - ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/candidate/login');
      await expect(page.locator('body')).toHaveScreenshot(`responsive/login-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});
test.describe('Visual Regression - Authentication Flow', () => {
  test('complete auth flow - signup to dashboard', async ({ page }, testInfo) => {
    await page.goto('/auth/signup');
    
    // Fill out signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.fill('[data-testid="confirm-password-input"]', 'Password123!');
    await page.fill('[data-testid="company-name-input"]', 'Test Company');
    
    await expect(page.locator('body')).toHaveScreenshot('auth/flow-signup-form.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Submit form
    await page.click('[data-testid="signup-button"]');
    
    // Capture success state
    await expect(page.locator('body')).toHaveScreenshot('auth/flow-signup-success.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 10000,
    });
  });
});
test.describe('Visual Regression - Error States', () => {
  test('error states - validation errors', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Submit empty form to trigger validation
    await page.click('[data-testid="signup-button"]');
    
    await expect(page.locator('body')).toHaveScreenshot('auth/error-validation.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('error states - form submission failure', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Try to submit with invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'short');
    await page.click('[data-testid="signup-button"]');
    
    await expect(page.locator('body')).toHaveScreenshot('auth/error-submission.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
test.describe('Visual Regression - Loading States', () => {
  test('loading states - form submission', async ({ page }, testInfo) => {
    await page.goto('/auth/signup');
    
    // Fill form but don't submit
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    
    await expect(page.locator('body')).toHaveScreenshot('auth/loading-state.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
test.describe('Visual Regression - Admin Interface', () => {
  test('admin interface - job management', async ({ page }) => {
    await page.goto('/admin/jobs');
    await expect(page.locator('body')).toHaveScreenshot('admin/job-management.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('admin interface - candidate management', async ({ page }) => {
    await page.goto('/admin/candidates');
    await expect(page.locator('body')).toHaveScreenshot('admin/candidate-management.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
test.describe('Visual Regression - Mobile Experience', () => {
  test('mobile - interview flow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apply/[jobId]');
    await expect(page.locator('body')).toHaveScreenshot('mobile/interview-flow.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('mobile - onboarding tour', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/welcome');
    await expect(page.locator('body')).toHaveScreenshot('mobile/onboarding-tour.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
test.describe('Visual Regression - Accessibility', () => {
  test('accessibility - keyboard navigation', async ({ page }) => {
    await page.goto('/candidate/login');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    await expect(page.locator('body')).toHaveScreenshot('accessibility/keyboard-navigation.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

export default {}
