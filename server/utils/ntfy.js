const axios = require('axios');

/**
 * Sends a push notification via ntfy
 * @param {string} topic - The user's subscribed topic
 * @param {string} callerName - Name of the person calling
 * @param {string} type - 'video' or 'audio' or 'test'
 * @param {string} customServer - Optional custom server URL
 */
const sendCallNotification = async (topic, callerName, type, customServer = null) => {
    // Use custom server if provided by user, else default
    const ntfyServer = customServer || process.env.NTFY_SERVER_URL || 'https://ntfy.sh';
    
    // Ensure no double slashes if user adds trailing slash
    const cleanServer = ntfyServer.replace(/\/$/, "");
    const fullUrl = `${cleanServer}/${topic}`;

    console.log(`🔔 Sending Ntfy alert to: ${fullUrl}`);

    try {
        await axios.post(fullUrl, {
            topic: topic,
            title: type === 'test' ? "HausCall Test" : "Incoming HausCall",
            message: type === 'test' 
                ? "Your notifications are working perfectly!" 
                : `${callerName} is requesting a ${type} call...`,
            priority: 5,
            tags: ["rotating_light", "calling"],
            click: process.env.APP_URL || "https://hauscall.local",
            actions: [
                {
                    action: "view",
                    label: "Open App",
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