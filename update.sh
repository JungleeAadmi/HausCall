#!/bin/bash

# Configuration
APP_DIR="/opt/HausCall"
SERVICE_NAME="hauscall"
DB_PATH="$APP_DIR/server/database.sqlite"
BACKUP_PATH="/tmp/hauscall_db.bak"

echo "=========================================="
echo "   HausCall Updater (Aggressive Mode)"
echo "=========================================="

# 1. Validation
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: App directory not found at $APP_DIR"
    echo "   Please run install.sh first."
    exit 1
fi

# 2. Stop Service FIRST (Prevent file locking)
echo ">> [1/6] Stopping HausCall Service..."
systemctl stop $SERVICE_NAME

# 3. Backup Database
echo ">> [2/6] Backing up User Database..."
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_PATH"
    echo "   ✅ Database backed up."
else
    echo "   ⚠️ No database found (skipping backup)."
fi

# 4. Pull Latest Code
echo ">> [3/6] Pulling latest code from GitHub..."
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main

# 5. Restore Database
echo ">> [4/6] Restoring User Database..."
if [ -f "$BACKUP_PATH" ]; then
    mv "$BACKUP_PATH" "$DB_PATH"
    echo "   ✅ Database restored."
fi

# 6. Rebuild Application
echo ">> [5/6] Rebuilding Dependencies..."

echo "   -- Server (Backend)..."
cd "$APP_DIR/server"
rm -rf node_modules package-lock.json # Force clean install
npm install

echo "   -- Client (Frontend)..."
cd "$APP_DIR/client"
rm -rf node_modules package-lock.json # Force clean install
npm install
npm run build

# 7. Restart Service
echo ">> [6/6] Starting HausCall Service..."
systemctl daemon-reload
systemctl start $SERVICE_NAME
systemctl status $SERVICE_NAME --no-pager

# Detect IP Address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "   Update Complete! System is live."
echo "   Access it at: http://$IP_ADDR:5000"
echo "=========================================="