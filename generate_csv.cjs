const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { parse } = require("json2csv");

const inputFolder = path.resolve(__dirname, "Output"); // Change to your folder
const outputFolder = path.resolve(__dirname, "Output/Generate");

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// Arrays to store CSV data
let summaryData = [];
let alertsData = [];

// Read all HTML files from input folder
const files = fs.readdirSync(inputFolder);
files.forEach((file) => {
  if (path.extname(file) === ".html") {
    // Format the URL from filename
    let formattedURL = file
      .replace(/\.html$/, "") // Remove .html
      .replace(/(_\d{4}-\d{2}-\d{2}T.*)/, "") // Remove timestamp
      .replace(/_/g, "/"); // Replace _ with /

    let filePath = path.join(inputFolder, file);
    let html = fs.readFileSync(filePath, "utf8");
    let $ = cheerio.load(html);

    // Extract Summary Table
    $("table.summary tbody tr").each((_, row) => {
      let columns = $(row).find("td");
      if (columns.length === 2) {
        let riskLevel = $(columns[0]).text().trim();
        let numAlerts = $(columns[1]).text().trim();
        summaryData.push({ url: formattedURL, riskLevel, numAlerts });
      }
    });

    // Extract Alerts Table
    $("table.alerts tbody tr").each((_, row) => {
      let columns = $(row).find("td");
      if (columns.length === 3) {
        let riskName = $(columns[0]).text().trim();
        let riskLevel = $(columns[1]).text().trim();
        let numInstances = $(columns[2]).text().trim();
        alertsData.push({
          url: formattedURL,
          riskName,
          riskLevel,
          numInstances,
        });
      }
    });
  }
});

// Convert data to CSV
const summaryCSV = parse(summaryData, {
  fields: ["url", "riskLevel", "numAlerts"],
});
const alertsCSV = parse(alertsData, {
  fields: ["url", "riskName", "riskLevel", "numInstances"],
});

// Write CSV files
fs.writeFileSync(path.join(outputFolder, "summary.csv"), summaryCSV, "utf8");
fs.writeFileSync(path.join(outputFolder, "alerts.csv"), alertsCSV, "utf8");

console.log(`✅ CSV files generated successfully in "${outputFolder}"`);
