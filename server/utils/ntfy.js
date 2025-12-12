const axios = require('axios');

/**
 * Sends a push notification via ntfy
 * @param {string} topic - The user's subscribed topic (e.g., 'hauscall_david_key')
 * @param {string} callerName - Name of the person calling
 * @param {string} type - 'video' or 'audio'
 */
const sendCallNotification = async (topic, callerName, type) => {
    // Get the ntfy server URL from environment, default to public ntfy.sh if not set
    const ntfyServer = process.env.NTFY_SERVER_URL || 'https://ntfy.sh';
    const fullUrl = `${ntfyServer}/${topic}`;

    console.log(`🔔 Sending Ntfy alert to: ${fullUrl}`);

    try {
        await axios.post(fullUrl, {
            topic: topic,
            title: "Incoming HausCall",
            message: `${callerName} is requesting a ${type} call...`,
            priority: 5, // 5 = Max priority (wakes up screen, breaks silent mode)
            tags: ["rotating_light", "calling"],
            click: process.env.APP_URL || "https://hauscall.local", // Opens app when clicked
            actions: [
                {
                    action: "view",
                    label: "Answer Call",
                    url: process.env.APP_URL || "https://hauscall.local"
                }
            ]
        });
        console.log("✅ Notification sent successfully.");
    } catch (error) {
        console.error("❌ Failed to send Ntfy notification:", error.message);
    }
};

module.exports = { sendCallNotification };