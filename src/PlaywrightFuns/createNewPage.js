import path from "path";
import fs from "node:fs";
import dotenv from 'dotenv';
dotenv.config();

export const STORAGE_FILE = path.resolve("storageState.json");

export async function createNewPage(browser) {
  const useAuthentication = process.env.USE_AUTHENTICATION !== 'false';
  const storageFileExists = fs.existsSync(STORAGE_FILE);
  
  // Configuration for browser context
  const contextOptions = {
    ignoreHTTPSErrors: true,
    proxy: { server: process.env.ZAP_PROXY || "http://localhost:8888" },
  };
  
  // Only add storageState if authentication is enabled AND the file exists
  if (useAuthentication && storageFileExists) {
    contextOptions.storageState = STORAGE_FILE;
    console.log("🔐 Using authenticated session");
  } else if (useAuthentication && !storageFileExists) {
    console.log("⚠️  Authentication enabled but storageState.json not found - running unauthenticated");
  } else {
    console.log("🌐 Running in unauthenticated mode");
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  return page;
}
