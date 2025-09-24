require("dotenv").config(); // Load environment variables from .env file

export async function submitLogin(page) {
  console.log("🌍 Navigating to Login Page...");
  try {
    console.log(`🔑 Logging in as ${process.env.LOGIN_URL}...`);
    await page.goto(process.env.LOGIN_URL, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    console.log(`🔑 Logging in with USEREMAIL: process.env.USEREMAIL ${process.env.USEREMAIL}.`);
    await page.fill("#Email", process.env.USEREMAIL || 'hossamtest@test.com');

    console.log(`🔑 Logging With PASSWORD: ${process.env.PASSWORD} '`);
    await page.fill("#Password", process.env.PASSWORD);
    await page.click('button[type="submit"]:first-of-type');

    await page.waitForLoadState("networkidle", { timeout: 60000 });
    await page.waitForSelector('p.date', { timeout: 60000 });
    console.log("🔐 Authentication successful");
  } catch (error) {
    console.error("❌ Login failed:", error);
    throw error;
  }
}
