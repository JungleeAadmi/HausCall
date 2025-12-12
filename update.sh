#!/bin/bash

# Configuration
APP_DIR="/opt/HausCall"
SERVICE_NAME="hauscall"
DB_PATH="$APP_DIR/server/database.sqlite"
BACKUP_PATH="/tmp/hauscall_db.bak"

echo "=========================================="
echo "   HausCall Updater"
echo "=========================================="

# 1. Validation
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: App directory not found at $APP_DIR"
    echo "   Please run install.sh first."
    exit 1
fi

# 2. Backup Database
echo ">> [1/5] Backing up User Database..."
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_PATH"
    echo "   ✅ Database backed up to $BACKUP_PATH"
else
    echo "   ⚠️ No database found (skipping backup)."
fi

# 3. Pull Latest Code
echo ">> [2/5] Pulling latest code from GitHub..."
cd "$APP_DIR"
# Fetch latest metadata
git fetch origin
# Reset local code to match remote exactly (discards local code changes)
git reset --hard origin/main

# 4. Restore Database
echo ">> [3/5] Restoring User Database..."
if [ -f "$BACKUP_PATH" ]; then
    mv "$BACKUP_PATH" "$DB_PATH"
    echo "   ✅ Database restored."
else
    echo "   ⚠️ No backup found to restore."
fi

# 5. Rebuild Application
echo ">> [4/5] Rebuilding Dependencies..."

echo "   -- Server (Backend)..."
cd "$APP_DIR/server"
npm install

echo "   -- Client (Frontend)..."
cd "$APP_DIR/client"
npm install
npm run build

# 6. Restart Service
echo ">> [5/5] Restarting HausCall Service..."
if systemctl is-active --quiet $SERVICE_NAME; then
    systemctl restart $SERVICE_NAME
    echo "   ✅ Service restarted."
else
    echo "   ⚠️ Service '$SERVICE_NAME' is not running or installed."
    echo "      Attempting to start..."
    systemctl start $SERVICE_NAME
fi

# Detect IP Address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "   Update Complete! System is live."
echo "   Access it at: http://$IP_ADDR:5000"
echo "=========================================="