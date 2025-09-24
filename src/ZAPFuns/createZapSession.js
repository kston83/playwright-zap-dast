const axios = require("axios");
require('dotenv').config(); // Load environment variables from .env file

export async function createZapSession() {
    var ZAP_PROXY = process.env.ZAP_PROXY || 'http://localhost:8888';
    var zapSession;
    try {
        const newSession =
            await axios.get(`${ZAP_PROXY}/JSON/core/action/newSession/`,
                { params: { overwrite: true } });
        zapSession = newSession.data.session;
        console.log(`✅ New ZAP Session ID: ${zapSession}`);
    } catch (error) {
        console.error("❌ Error creating ZAP session:", error);
        throw error;
    }
    return zapSession;
}