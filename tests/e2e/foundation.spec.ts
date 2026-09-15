import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("the capture grid opens a contextual hangout and keeps review explicit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();
  await page.getByRole("button", { name: "Saturday in Newtown" }).click();
  await expect(page.getByText("Maya and Ari finally tried the beginner wall")).toBeVisible();
  await page.getByRole("button", { name: "Keep this as a moment" }).click();
  await expect(page.getByText("Was this with Maya Chen and Ari Singh?")).toBeVisible();
  await page.getByRole("button", { name: "Keep moment" }).click();
  await expect(page.locator(".save-message")).toContainText("Moment saved privately");
});

test("plan calendar and recommendation are interactive", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tue 17" }).click();
  await expect(page.getByText("Tue 17 · 6:30pm")).toBeVisible();
  await page.getByRole("button", { name: "View Beginner bouldering" }).click();
  await expect(page.getByText("is a fair trip for you both.")).toBeVisible();
});

test("review remains accessible from settings and requires approval", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Review saved context" }).click();
  await expect(page.getByText("Source: “started her internship” in the linked note.")).toBeVisible();
  await page.getByRole("button", { name: "Approve as memory" }).click();
  await expect(page.getByLabel("Edit memory").first()).toHaveValue("started her internship");
});

test("an event recommendation still leads to an editable offline plan draft", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "View Beginner bouldering" }).click();
  await page.getByRole("button", { name: "Make draft" }).click();
  await page.getByLabel("Draft message").fill("Want to try bouldering next week?");
  await page.getByRole("button", { name: "Save draft, do not send" }).click();
  await expect(page.getByText("Want to try bouldering next week?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy draft message" })).toBeVisible();
});
