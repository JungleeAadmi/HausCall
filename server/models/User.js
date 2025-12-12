const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // The ntfy topic (e.g., 'hauscall_david_123')
    ntfyTopic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // We store friends as a JSON string of User IDs for simplicity in SQLite
    // In a larger app, we'd use a join table, but this is efficient for home use.
    // Format: ["uuid-1", "uuid-2"]
    friends: {
        type: DataTypes.TEXT, 
        defaultValue: "[]",
        get() {
            const rawValue = this.getDataValue('friends');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('friends', JSON.stringify(value));
        }
    },
    // Pending friend requests (Sent TO this user)
    // Format: ["uuid-3", "uuid-4"]
    friendRequests: {
        type: DataTypes.TEXT,
        defaultValue: "[]",
        get() {
            const rawValue = this.getDataValue('friendRequests');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('friendRequests', JSON.stringify(value));
        }
    }
});

module.exports = User;