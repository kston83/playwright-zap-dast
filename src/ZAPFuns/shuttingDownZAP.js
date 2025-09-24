const axios = require("axios");
require('dotenv').config(); // Load environment variables from .env file

export async function shuttingDownZAP(zapSession) {
    var ZAP_PROXY = process.env.ZAP_PROXY || 'http://localhost:8888';
    try {
        await axios.get(`${ZAP_PROXY}/JSON/core/action/shutdown/`,
            { params: { apikey: zapSession } });
        console.log("⚡ ZAP Shutdown Successfully");
    } catch (error) {
        console.error("❌ Error shutting down ZAP:", error);
    }
}