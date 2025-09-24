const { chromium } = require("playwright");
import { test } from "@playwright/test";
const { createZapSession } = require("./ZAPFuns/createZapSession");
import { shuttingDownZAP } from "./ZAPFuns/shuttingDownZAP";
const { runSpiderScan } = require("./ZAPFuns/runSpiderScan");
const { runActiveScan } = require("./ZAPFuns/runActiveScan");
const { generateReport } = require("./ZAPFuns/generateReport");
const { delay } = require("./ZAPFuns/delay_fun");
const { getURLsList } = require("../Utils/getListURLS");
const { createNewPage } = require("./PlaywrightFuns/createNewPage");
require("dotenv").config(); // Load environment variables from .env file

test.describe("Automated Penetration Testing with OWASP ZAP", () => {
  let browser, page, zapSession;
  let URLS = [];
  var ZAP_PROXY = process.env.ZAP_PROXY || "http://localhost:8888";

  test.beforeAll(async () => {
    URLS = getURLsList();
  });

  test.beforeEach("Setup and Authentication", async () => {
    console.log(`ZAP_PROXY::: ${ZAP_PROXY}`);
    // ** Define the Browser
    browser = await chromium.launch({
      headless: false,
      args: [`--proxy-server=${ZAP_PROXY}`, "--ignore-certificate-errors"],
    });
    page = await createNewPage(browser);
    // **Create Zap Session
    zapSession = await createZapSession();
  });

  test(`Scanning Each URL`, async ({ context }) => {
    for (const url of URLS) {
      console.log(`➡️ Navigating to: ${url}`);
      try {
        // Disable cache by intercepting requests
        await context.route("**", (route) => {
          const request = route.request();
          route.continue({
            headers: {
              ...request.headers(),
              "Cache-Control":
                "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
        });

        await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      } catch (error) {
        console.error(`❌ Navigation failed for ${url}:`, error);
        continue;
      }

      // Begin Spider scan
      await runSpiderScan(url, zapSession);
      await delay(5000); // Add delay between scans

      await runActiveScan(url, zapSession);
      await delay(5000); // Add delay before generating reports

      await generateReport(url);
    }
  });

  test.afterEach("Cleanup", async () => {
    if (browser) await browser.close();
    await shuttingDownZAP(zapSession);
  });
});
