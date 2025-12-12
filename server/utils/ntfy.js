const axios = require('axios');

/**
 * Sends a push notification via ntfy
 * @param {string} topic - The user's subscribed topic
 * @param {string} callerName - Name of the person calling (or Test)
 * @param {string} type - 'video' | 'audio' | 'test'
 * @param {string} customServer - Optional custom server URL
 */
const sendCallNotification = async (topic, callerName, type, customServer = null) => {
    // 1. Determine Server URL
    let ntfyServer = customServer || process.env.NTFY_SERVER_URL || 'https://ntfy.sh';
    
    // 2. Clean URL (Remove trailing slash if present)
    ntfyServer = ntfyServer.replace(/\/$/, "");
    
    // 3. Construct Full URL
    const fullUrl = `${ntfyServer}/${topic}`;

    console.log(`🔔 Sending Ntfy alert to: ${fullUrl}`);

    try {
        const title = type === 'test' ? "HausCall Test" : "Incoming HausCall";
        const message = type === 'test' 
            ? "Notifications are working!" 
            : `${callerName} is requesting a ${type} call...`;
        
        // 4. Send Request
        await axios.post(fullUrl, {
            topic: topic,
            title: title,
            message: message,
            priority: 5, // High priority to break doze mode
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
        if (error.response) {
            console.error("   Response Data:", error.response.data);
        }
    }
};

module.exports = { sendCallNotification };