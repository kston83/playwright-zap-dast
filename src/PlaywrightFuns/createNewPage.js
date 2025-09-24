import path from "path";
import dotenv from 'dotenv';
dotenv.config();

export const STORAGE_FILE = path.resolve("storageState.json");
export async function createNewPage(browser) {
  var context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: STORAGE_FILE,
    proxy: { server: process.env.ZAP_PROXY || "http://localhost:8888" },
  });

  var page = await context.newPage();
  return page;
}
