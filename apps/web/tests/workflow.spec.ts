import { test, expect } from "@playwright/test";
import { appendLedger, cachedAnalysis, demos, validateFiles } from "../lib/api";

test("merging pages preserves totals, renumbers sparse pages, and handles unnumbered CSV rows", () => {
  const original = {
    business_name: "Shop",
    entries: [
      {
        date: "2026-10-01",
        description: "sale",
        type: "sale" as const,
        amount: 200,
        page: 4,
      },
    ],
    pages: [{ page: 4, stated_total: 200 }],
  };
  const extra = {
    entries: [
      {
        date: "2026-10-02",
        description: "sale",
        type: "sale" as const,
        amount: 300,
        page: 10,
      },
      {
        date: "2026-10-03",
        description: "sale",
        type: "sale" as const,
        amount: 100,
      },
    ],
    pages: [{ page: 10, stated_total: 300 }],
  };
  const merged = appendLedger(original, extra);
  expect(merged.entries.map((e) => e.page)).toEqual([4, 6, 5]);
  expect(merged.pages).toEqual([
    { page: 4, stated_total: 200 },
    { page: 5 },
    { page: 6, stated_total: 300 },
  ]);
  expect(original.entries).toHaveLength(1);
});

test("cached reports cannot be used for edited records, and invalid uploads are rejected", () => {
  const sample = structuredClone(demos[0].ledger);
  expect(cachedAnalysis(sample)).not.toBeNull();
  sample.entries[0].amount += 1;
  expect(cachedAnalysis(sample)).toBeNull();
  expect(() =>
    validateFiles([
      new File(["test"], "input.csv"),
      new File(["test"], "page.jpg"),
    ]),
  ).toThrow("one CSV");
  expect(() =>
    validateFiles(
      Array.from({ length: 7 }, () => new File(["test"], "page.jpg")),
    ),
  ).toThrow("6 photos");
  expect(() =>
    validateFiles([
      new File([new Uint8Array(8 * 1024 * 1024 + 1)], "page.jpg"),
    ]),
  ).toThrow("8 MB");
});

for (const [id, name, score] of [
  ["rahim", "Rahim", 96],
  ["nadia", "Nadia", 65],
  ["bilal", "Bilal", 13],
] as const) {
  test(`${name}: live sample → editable ledger → real API assessment (${score})`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("Service connected", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`Try ${name}`) }).click();
    await expect(
      page.getByRole("heading", { name: "Every entry matters." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Analyse my khata" }).click();
    await expect(
      page.getByRole("img", { name: new RegExp(`score ${score} out of 100`) }),
    ).toBeVisible();
    await expect(
      page.getByText("Sample demo report.", { exact: true }),
    ).not.toBeVisible();
    await page.getByRole("button", { name: "اردو", exact: true }).click();
    await expect(page.locator('[lang="ur"][dir="rtl"]')).toBeVisible();
    await expect(page.locator('[lang="ur"][dir="rtl"]')).toContainText(
      "اگلے قدم",
    );
    if (id === "bilal") {
      await expect(
        page.getByText("Page total doesn't add up", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Review ledger", exact: true })
        .click();
      await expect(page.locator(".flagged-row").first()).toBeVisible();
      // Page 3's 20 rows (wrong written total) + the one outlier row, not its whole page.
      await expect(
        page.getByRole("button", { name: /Needs review/ }),
      ).toContainText("Needs review (21)");
    }
    if (id === "rahim") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: "test-results/credit-report.png",
        fullPage: true,
      });
    }
  });
}

test("ledger editing, deletion, adding, filters, and fresh scoring work together", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Try Nadia/ }).click();
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await expect(
    page.getByRole("img", { name: /score 65 out of 100/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review ledger", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Amount for entry 1", exact: true })
    .fill("5500");
  await expect(
    page.getByRole("button", { name: "Credit report", exact: true }),
  ).toBeDisabled();
  const initial = Number(
    await page
      .locator(".toolbar-count")
      .innerText()
      .then((t) => t.split(" ")[0]),
  );
  await page
    .getByRole("button", { name: "Delete entry 2", exact: true })
    .click();
  await expect(page.locator(".toolbar-count")).toHaveText(
    `${initial - 1} entries`,
  );
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await expect(page.locator(".error-notice")).toContainText(
    "amount greater than zero",
  );
  await page
    .getByRole("spinbutton", {
      name: `Amount for entry ${initial}`,
      exact: true,
    })
    .fill("3000");
  await page
    .getByRole("textbox", { name: "Search entries", exact: true })
    .fill("nothing-matches");
  await expect(page.getByText("No entries match your search.")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search entries", exact: true })
    .fill("");
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await expect(page.locator(".gauge")).toBeVisible();
  await expect(
    page.getByText("Sample demo report.", { exact: true }),
  ).not.toBeVisible();
});

test("CSV import, append, and API validation errors are usable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Service connected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload photos", exact: false }),
  ).toBeDisabled();
  const csv =
    "date,type,amount,description,page\n2026-08-01,sale,4000,Daily sales,1\n2026-09-01,purchase,1200,Stock,1";
  await page
    .getByLabel("Upload CSV", { exact: true })
    .setInputFiles({
      name: "ledger.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await expect(page.locator(".toolbar-count")).toHaveText("2 entries");
  await page
    .getByLabel("Add ledger pages", { exact: true })
    .setInputFiles({
      name: "more.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await expect(page.locator(".toolbar-count")).toHaveText("4 entries");
  await expect(page.locator(".page-pill")).toHaveText(["1", "1", "2", "2"]);
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await expect(page.locator(".gauge")).toBeVisible();
  await page
    .getByRole("button", { name: "Review ledger", exact: true })
    .click();
  // Duplicate flags initially show only the affected rows; turn off that filter.
  await page.getByRole("button", { name: /Needs review/ }).click();
  await page
    .getByLabel("Add ledger pages", { exact: true })
    .setInputFiles({
      name: "bad.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("wrong,headers\n1,2"),
    });
  await expect(page.locator(".error-notice")).toBeVisible();
  await expect(page.locator(".toolbar-count")).toHaveText("4 entries");
});

test("offline samples show provenance, and edited ledgers never receive stale cached scores", async ({
  page,
}) => {
  await page.route("http://localhost:8000/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText("Sample demo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Try Rahim/ }).click();
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await expect(
    page.getByText("Sample demo report.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review ledger", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Amount for entry 1", exact: true })
    .fill("99");
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await expect(page.locator(".error-notice")).toContainText(
    "Edited ledgers need the live service",
  );
  await expect(page.locator(".gauge")).not.toBeVisible();
});

test("mobile layouts, Urdu, navigation, and reset confirmation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/mobile-overview.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: /Try Rahim/ }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Analyse my khata" }).click();
  await page.getByRole("button", { name: "اردو", exact: true }).click();
  await expect(page.locator('[lang="ur"][dir="rtl"]')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/mobile-report.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Four steps. Nothing hidden." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "New assessment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "New assessment", exact: true })
    .click();
  await page.getByRole("button", { name: "Start fresh", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: /Small business/ }),
  ).toBeVisible();
});

test("photo controls submit multiple pages and surface extraction warnings and low confidence", async ({
  page,
}) => {
  await page.route("**/health", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: { ...(await response.json()), llm_enabled: true },
    });
  });
  let uploaded = false;
  await page.route("**/api/extract", async (route) => {
    const body = route.request().postDataBuffer()?.toString() || "";
    uploaded =
      body.includes('filename="page-1.jpg"') &&
      body.includes('filename="page-2.jpg"');
    await route.fulfill({
      json: {
        business_name: "Photo Shop",
        entries: [
          {
            date: "2026-10-01",
            description: "Handwritten sale",
            type: "sale",
            amount: 1000,
            page: 1,
            confidence: 0.45,
          },
          {
            date: "2026-10-02",
            description: "Stock",
            type: "purchase",
            amount: 400,
            page: 2,
            confidence: 0.95,
          },
        ],
        pages: [
          { page: 1, stated_total: 1000 },
          { page: 2, stated_total: 400 },
        ],
        source: "gemini",
        warnings: ["Review the handwritten dates before analysing."],
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Upload photos", exact: false }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Take a photo", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Upload khata photos", { exact: true }).setInputFiles([
    {
      name: "page-1.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("image fixture"),
    },
    {
      name: "page-2.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("image fixture"),
    },
  ]);
  await expect(
    page.getByRole("heading", { name: "Every entry matters." }),
  ).toBeVisible();
  expect(uploaded).toBe(true);
  await expect(
    page.getByText("Review the handwritten dates before analysing.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".flagged-row")).toHaveCount(1);
});

test("a sleeping API is retried until the live service connects", async ({
  page,
}) => {
  let failures = 1;
  await page.route("**/health", (route) =>
    failures-- > 0 ? route.abort() : route.continue(),
  );
  await page.goto("/");
  await expect(page.getByText("Sample demo", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Service connected", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
});
