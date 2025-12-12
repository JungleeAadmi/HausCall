const axios = require('axios');

const sendCallNotification = async (topic, callerName, type, customServer = null) => {
    // 1. Determine Server URL
    let ntfyServer = customServer || process.env.NTFY_SERVER_URL || 'https://ntfy.sh';
    
    // 2. Clean URL
    ntfyServer = ntfyServer.replace(/\/$/, "");
    
    // 3. Construct Full URL
    const fullUrl = `${ntfyServer}/${topic}`;

    console.log(`🔔 Sending Ntfy alert to: ${fullUrl}`);

    try {
        const title = type === 'test' ? "HausCall Test" : "Incoming HausCall";
        const message = type === 'test' 
            ? "Notifications are working!" 
            : `${callerName} is requesting a ${type} call...`;
        
        await axios.post(fullUrl, {
            topic: topic,
            title: title,
            message: message,
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