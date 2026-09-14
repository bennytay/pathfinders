import { expect, test } from "@playwright/test";
test("fixture mode supports an offline local-first capture flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load synthetic fixture instead" }).click();
  await expect(page.getByText("Local-only workspace")).toBeVisible();
  await page.getByRole("button", { name: "Capture" }).click();
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.locator(".voice-status")).toContainText("Use text instead");
  await page.getByLabel("Reflection").fill("Synthetic e2e reflection");
  await page.getByRole("button", { name: "Save text reflection locally" }).click();
  await expect(page.locator(".save-message")).toContainText("Saved locally");
});

test("a user can set up a circle, add a person, and inspect local data", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Circle name").fill("Weekend people");
  await page.getByLabel("City").fill("Sydney");
  await page.getByRole("button", { name: "Create local circle" }).click();
  await page.getByRole("button", { name: "Circle", exact: true }).click();
  await page.getByLabel("Display name").fill("Alex");
  await page.getByRole("button", { name: "Add to circle" }).click();
  await expect(page.getByRole("heading", { name: "Alex" })).toBeVisible();
  await page.getByRole("button", { name: "Data manager" }).click();
  await expect(page.getByText("All records, local workspace")).toBeVisible();
  await expect(page.getByText("Friends", { exact: true })).toBeVisible();
});
