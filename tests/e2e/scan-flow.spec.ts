import { test } from "@playwright/test";
test("screenshot scan flow", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/gate.png" });
  await page.getByRole("button", { name: "Scan my photos" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/scanning.png" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/gallery.png" });
});
