const axios = require("axios");
const { delay } = require("./delay_fun");
require('dotenv').config(); // Load environment variables from .env file

export async function runActiveScan(url, zapSession) {
    var ZAP_PROXY = process.env.ZAP_PROXY || 'http://localhost:8888';
    console.log(`⚡ Starting Active Scan for: ${url}`);

    try {
        const activeScanResponse = await axios.get(`${ZAP_PROXY}/JSON/ascan/action/scan/`, {
            params: { url: url, apikey: zapSession },
        });

        const scanId = activeScanResponse.data.scan;
        console.log(`🔍 Active Scan ID: ${scanId}`);

        let activeStatus = 0;
        while (activeStatus < 100) {
            const statusResponse = await axios.get(`${ZAP_PROXY}/JSON/ascan/view/status/`, {
                params: { scanId: scanId, apikey: zapSession },
            });

            activeStatus = parseInt(statusResponse.data.status);
            console.log(`⚡ Active Scan Progress: ${activeStatus}%`);
            await delay(10000);
        }

        console.log("✅ Active Scan Completed");
    } catch (error) {
        console.error(`❌ Active Scan Error: ${error.response ? error.response.data : error.message}`);
    }
}