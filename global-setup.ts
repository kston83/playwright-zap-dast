import { chromium } from "@playwright/test";
import 'dotenv/config';

async function globalSetup() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const LOGIN_URL = process.env.LOGIN_URL ?? "www.example.com";
    const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
    const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;
    const COMMON_SELECTOR = process.env.COMMON_SELECTOR ?? "body";

    console.log(`🔗 Base URL: ${LOGIN_URL}`);
    console.log(`🔗 LOGIN EMAIL: ${LOGIN_EMAIL}`);
    console.log(`🔗 LOGIN PASSWORD: ${LOGIN_PASSWORD}`);
    console.log(`🔗 COMMON SELECTOR: ${COMMON_SELECTOR}`);

    console.log(`📧 Using credentials from environments.ts`);

    // 🛠 Avoid double "/erp/"
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 120000 });

    // 🛠 Wait explicitly for login form
    await page.waitForSelector("input[id='Email'], input[name='Email']", {
        timeout: 100000,
    });

    await page.fill("input[id='Email'], input[name='Email']", LOGIN_EMAIL!);
    await page.fill("input[id='Password'], input[name='Password']", LOGIN_PASSWORD!);

    await page.click("button[type='submit']");

    // 🛠 Confirm successful login
    await page.waitForSelector(COMMON_SELECTOR, { timeout: 120000 });

    // Save storage
    await context.storageState({ path: "storageState.json" });
    console.log("✅ storageState.json saved.");

    await browser.close();
}

export default globalSetup;