import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("scanning the photo library surfaces a highlight with remembered context", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();
  await page.getByRole("button", { name: "Scan my photos" }).click();
  await expect(page.getByText("One more game before the sun went down.")).toBeVisible();
  await expect(page.getByText("Priya Shah · The Courts · Sep 7, 2026")).toBeVisible();
  await expect(page.getByRole("button", { name: "Scan for new photos" })).toBeVisible();
});

test("the weekly calendar and circle recommendations are interactive", async ({ page }) => {
  await page.goto("/");
  await page.locator(".calendar-event.ai-suggested").click();
  await expect(page.getByText("AI suggestion: Run club with Isla")).toBeVisible();
  await expect(page.getByText("Invite Isla for the 5:30pm beginner loop, then stay for the post-run drink.")).toBeVisible();
  await page.getByRole("button", { name: "Close event details" }).click();
  await page.getByRole("button", { name: /Beginner bouldering/ }).click();
  await expect(page.getByText("This matches Priya based on the interests you saved. Pick a time, then make an editable plan draft.")).toBeVisible();
});

test("an event recommendation leads to an editable, unsent plan draft", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Beginner bouldering/ }).click();
  await page.getByRole("button", { name: "Make a draft" }).click();
  await page.getByRole("button", { name: "Use in draft" }).first().click();
  await page.getByLabel("Draft message").fill("Want to try bouldering next week?");
  await page.getByRole("button", { name: "Save draft, do not send" }).click();
  await expect(page.getByText("Want to try bouldering next week?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy draft message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record planned" })).toBeVisible();
});

test("a person's contact card shows shared context and accepts an address", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "People" }).click();
  await page.getByRole("button", { name: /Priya/ }).first().click();
  await expect(page.getByRole("heading", { name: "Priya" })).toBeVisible();
  await page.getByLabel("Address").fill("14 Station St, Newtown");
  await expect(page.getByLabel("Address")).toHaveValue("14 Station St, Newtown");
  await expect(page.getByText("Beginner bouldering")).toBeVisible();
  await page.getByRole("button", { name: "Back to people" }).click();
  await expect(page.getByRole("heading", { name: "Your circle" })).toBeVisible();
});
