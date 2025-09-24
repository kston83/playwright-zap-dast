const fs = require("fs");
const path = require("path");

export function getURLsList() {
  let URLS = [];
  const urlsFilePath = path.join(process.cwd(), "urls.txt");

  try {
    URLS = fs
      .readFileSync(urlsFilePath, "utf-8")
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url);

    console.log(`✅ Loaded ${URLS.length} URLs for scanning`);
  } catch (error) {
    console.error(`❌ Error reading URLs file: ${error}`);
    process.exit(1);
  }
  return URLS;
}
