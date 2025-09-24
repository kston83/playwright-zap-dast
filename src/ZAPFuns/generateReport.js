const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config(); // Load environment variables from .env file

export async function generateReport(url) {
  var ZAP_PROXY = process.env.ZAP_PROXY || 'http://localhost:8888';
  console.log(`📄 Generating Report for: ${url}`);

  try {
    const reportResponse = await axios.get(
      `${ZAP_PROXY}/OTHER/core/other/htmlreport/`,
      {
        params: { apikey: process.env.API_KEY }, // Use API_KEY
        responseType: "stream", // Important: Get the response as a stream
      }
    );

    // Ensure the Output directory exists
    const outputDir = path.join(process.cwd(), "Output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true }); // Create directory if it doesn't exist
    }

    const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = path.join(
      outputDir,
      `${sanitizedUrl}_${timestamp}.html`
    );

    const writer = fs.createWriteStream(reportPath);
    reportResponse.data.pipe(writer); // Pipe the stream to the file

    writer.on("finish", () => {
      console.log(`✅ Report Saved: ${reportPath}`);
    });

    writer.on("error", (err) => {
      console.error(`❌ Report Generation Error (Writing to file): ${err}`);
    });
  } catch (error) {
    console.error(
      `❌ Report Generation Error: ${
        error.response ? error.response.data : error.message
      }`
    ); // Improved error message
  }
}
