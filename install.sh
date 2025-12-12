#!/bin/bash

# Configuration
APP_DIR="/opt/HausCall"
REPO_URL="https://github.com/JungleeAadmi/HausCall.git"
SERVICE_NAME="hauscall"
DB_PATH="$APP_DIR/server/database.sqlite"
BACKUP_PATH="/tmp/hauscall_db.bak"

echo "=========================================="
echo "   HausCall Installer / Updater"
echo "=========================================="

# 1. Timezone Setup (Interactive)
echo ">> [1/8] Configuring Timezone..."
if [ -f /etc/debian_version ]; then
    dpkg-reconfigure tzdata
else
    echo "   Skipping timezone (not Debian/Ubuntu)."
fi

# 2. System Updates
echo ">> [2/8] Updating System Packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git nodejs npm build-essential

# 3. Check for existing app & Backup
echo ">> [3/8] Checking for existing installation..."
if [ -d "$APP_DIR" ]; then
    echo "   Existing installation found."
    
    # Backup Database if it exists
    if [ -f "$DB_PATH" ]; then
        echo "   Backing up user database..."
        cp "$DB_PATH" "$BACKUP_PATH"
    fi
else
    echo "   New installation. Creating directory..."
    mkdir -p "$APP_DIR"
    # First time clone
    git clone "$REPO_URL" "$APP_DIR"
fi

# 4. Pull Latest Code (Force Update)
echo ">> [4/8] Pulling latest code from GitHub..."
cd "$APP_DIR"
# Reset to match remote exactly (discards local code changes, keeps ignored DB)
git fetch origin
git reset --hard origin/main

# 5. Restore Data
if [ -f "$BACKUP_PATH" ]; then
    echo ">> [5/8] Restoring user database..."
    mv "$BACKUP_PATH" "$DB_PATH"
fi

# 6. Build Backend
echo ">> [6/8] Installing Backend Dependencies..."
cd "$APP_DIR/server"
npm install

# 7. Build Frontend
echo ">> [7/8] Building Frontend (React PWA)..."
cd "$APP_DIR/client"
npm install
npm run build

# 8. Setup Systemd Service
echo ">> [8/8] Configuring Systemd Service..."
cat <<EOT > /etc/systemd/system/$SERVICE_NAME.service
[Unit]
Description=HausCall Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

echo "=========================================="
echo "   HausCall is live!"
echo "=========================================="
