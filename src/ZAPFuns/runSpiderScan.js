const axios = require("axios");
const { delay } = require('./delay_fun');
require('dotenv').config(); // Load environment variables from .env file

export async function runSpiderScan(url,zapSession) {
    var ZAP_PROXY = process.env.ZAP_PROXY || 'http://localhost:8888';
    console.log(`🕷️ Starting Spider Scan for: ${url}`);

    try {
        const spiderResponse = await axios.get(`${ZAP_PROXY}/JSON/spider/action/scan/`, {
            params: { url: url, recurse: true, apikey: zapSession },
        });

        const scanId = spiderResponse.data.scan;
        console.log(`🔍 Spider Scan ID: ${scanId}`);

        let spiderStatus = 0;
        while (spiderStatus < 100) {
            const statusResponse = await axios.get(`${ZAP_PROXY}/JSON/spider/view/status/`, {
                params: { scanId: scanId, apikey: zapSession },
            });

            spiderStatus = parseInt(statusResponse.data.status);
            console.log(`🕷️ Spider Scan Progress: ${spiderStatus}%`);
            await delay(5000);
        }

        console.log("✅ Spider Scan Completed");
    } catch (error) {
        console.error(`❌ Spider Scan Error: ${error}`);
    }
}