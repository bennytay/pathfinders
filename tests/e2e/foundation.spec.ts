import { expect, test } from "@playwright/test";

test("the synthetic mobile flow keeps photo detection reviewable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the synthetic demo" }).click();
  await expect(page.getByRole("heading", { name: "A small reason to make a plan." })).toBeVisible();
  await page.getByRole("button", { name: "Add a moment", exact: true }).first().click();
  await page.getByRole("button", { name: "Use the synthetic photo" }).click();
  await expect(page.getByText("Looks like Maya Chen and Ari Singh.")).toBeVisible();
  await expect(page.getByText("Synthetic example only. No photo library, upload, or face recognition was used.")).toBeVisible();
  await page.getByRole("button", { name: "Add this moment" }).click();
  await expect(page.locator(".save-message")).toContainText("Moment saved privately");
});

test("a user can create a Circle and use the manual recovery paths", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What do you call your circle?").fill("Weekend people");
  await page.getByLabel("Your city").fill("Sydney");
  await page.getByRole("button", { name: "Start my Circle" }).click();
  await page.getByRole("button", { name: "People" }).click();
  await page.getByText("Manage your Circle").click();
  await page.getByLabel("Name").fill("Alex");
  await page.getByRole("button", { name: "Add to Circle" }).click();
  await expect(page.locator(".people-list").getByText("Alex", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add a moment", exact: true }).first().click();
  await expect(page.getByText("Photo moments are not enabled yet")).toBeVisible();
  await page.getByLabel("Quick note").fill("A synthetic local note");
  await page.getByRole("button", { name: "Save this note" }).click();
  await expect(page.locator(".save-message")).toContainText("Saved privately");
});

test("review remains accessible from settings and requires approval", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the synthetic demo" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Review saved context" }).click();
  await expect(page.getByText("Source: “started her internship” in the linked note.")).toBeVisible();
  await page.getByRole("button", { name: "Approve as memory" }).click();
  await expect(page.getByLabel("Edit memory").first()).toHaveValue("started her internship");
});

test("a contextual opportunity still leads to an editable offline plan draft", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the synthetic demo" }).click();
  await page.getByRole("button", { name: "Find something" }).click();
  await expect(page.getByText("Why this appeared")).toBeVisible();
  await page.getByLabel("Draft message").fill("Want to try bouldering next week?");
  await page.getByRole("button", { name: "Save draft, do not send" }).click();
  await expect(page.getByText("Want to try bouldering next week?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy draft message" })).toBeVisible();
});
