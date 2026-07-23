# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components/security-gates.spec.ts >> Admin page basic smoke tests >> admin webhooks page loads without server error
- Location: scripts/visual-regression/components/security-gates.spec.ts:14:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/admin/webhooks
Call log:
  - navigating to "http://localhost:3001/admin/webhooks", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Admin page basic smoke tests", () => {
  4  |   test("admin dashboard page loads without server error", async ({ page }) => {
  5  |     const resp = await page.goto("/admin");
  6  |     expect(resp?.status()).toBeLessThan(500);
  7  |   });
  8  | 
  9  |   test("admin API keys page loads without server error", async ({ page }) => {
  10 |     const resp = await page.goto("/admin/api-keys");
  11 |     expect(resp?.status()).toBeLessThan(500);
  12 |   });
  13 | 
  14 |   test("admin webhooks page loads without server error", async ({ page }) => {
> 15 |     const resp = await page.goto("/admin/webhooks");
     |                             ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/admin/webhooks
  16 |     expect(resp?.status()).toBeLessThan(500);
  17 |   });
  18 | 
  19 |   test("admin settings page loads without server error", async ({ page }) => {
  20 |     const resp = await page.goto("/admin/settings");
  21 |     expect(resp?.status()).toBeLessThan(500);
  22 |   });
  23 | });
  24 | 
```