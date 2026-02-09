import { test, expect } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

async function login(page: import("@playwright/test").Page) {
  if (!E2E_EMAIL || !E2E_PASSWORD) return;

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(E2E_EMAIL);
  await page.getByPlaceholder("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("columns menu can show a default-hidden column", async ({ page }) => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    "Set E2E_EMAIL/E2E_PASSWORD to run against a real Supabase project."
  );

  await login(page);
  await page.goto("/orders");

  // Wait for the grid to mount.
  await expect(page.locator(".ag-root-wrapper")).toBeVisible();

  const customerPhoneCheckbox = page.locator(
    'li:has-text("Customer Phone") input[type="checkbox"]'
  );

  // Open the Columns popover.
  await page.getByRole("button", { name: "Columns" }).click();

  // It is default-hidden.
  await expect(customerPhoneCheckbox).not.toBeChecked();

  // Show it.
  await customerPhoneCheckbox.click();
  await expect(customerPhoneCheckbox).toBeChecked();

  // Header should appear in the grid.
  await expect(page.locator(".ag-header")).toContainText("Customer Phone");
});
