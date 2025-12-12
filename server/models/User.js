const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    
    // Ntfy Configuration
    ntfyTopic: { type: DataTypes.STRING, allowNull: true },
    ntfyServer: { type: DataTypes.STRING, defaultValue: 'https://ntfy.sh' },
    
    friends: {
        type: DataTypes.TEXT, 
        defaultValue: "[]",
        get() { return JSON.parse(this.getDataValue('friends') || "[]"); },
        set(value) { this.setDataValue('friends', JSON.stringify(value)); }
    },
    friendRequests: {
        type: DataTypes.TEXT,
        defaultValue: "[]",
        get() { return JSON.parse(this.getDataValue('friendRequests') || "[]"); },
        set(value) { this.setDataValue('friendRequests', JSON.stringify(value)); }
    }
});

module.exports = User;