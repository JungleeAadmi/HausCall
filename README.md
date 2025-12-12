## HausCall 🏠📞

**A self-hosted, peer-to-peer video and audio calling application designed for home networks (LXC/Tailscale).**

## Features

1. Self-Hosted: Runs on your own hardware (Proxmox LXC recommended).

2. Privacy First: Data stays on your server.

3. PWA Support: Installable on iOS/Android as a native-feeling app.

4. Notifications: Integrated with ntfy to wake up devices for incoming calls.

5. User Management: Simple sign-up with Profile, Friend Lists, and Search.

## 🚀 Installation

***Run this single command inside your LXC container (Ubuntu/Debian) to install the app.***

It will automatically:

Install dependencies (Node.js, etc.)

Clone the repository

Set up the Systemd service

Start the app

```
bash <(curl -s https://raw.githubusercontent.com/JungleeAadmi/HausCall/main/install.sh)
```

## 🔄 Updating

***To update the app to the latest version, run the exact same command.***

The script is smart enough to:

Detect an existing installation.

Backup your database.sqlite (User accounts/friends).

Pull the latest code from GitHub.

Restore your database.

Rebuild and restart the service.
```
bash <(curl -s https://raw.githubusercontent.com/JungleeAadmi/HausCall/main/update.sh)
```
## ⚙️ Post-Install Configuration

## ***Nginx Proxy Manager (Required for HTTPS) *** 

WebRTC requires HTTPS. Point your Nginx Proxy Manager to your LXC IP on port 5000.

Crucial: You must enable WebSocket support in Nginx. Add this to your proxy host's Custom Locations or Advanced Configuration:

location /socket.io/ {
    proxy_pass http://YOUR_LXC_IP:5000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}


## ***2. Notifications (ntfy)***

To receive call notifications when the app is closed:

Setup a self-hosted ntfy server or use ntfy.sh.

In your HausCall/server/.env file (created after install), set:

NTFY_SERVER_URL=[https://ntfy.yourdomain.com](https://ntfy.yourdomain.com)
APP_URL=[https://hauscall.yourdomain.com](https://hauscall.yourdomain.com)


Restart the service: systemctl restart hauscall