const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize SQLite Database
// This creates a file named 'database.sqlite' in the server directory
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false // Set to console.log to see raw SQL queries
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ SQLite Database Connected Successfully.');
        
        // Sync models (creates tables if they don't exist)
        // alter: true checks current tables and updates columns if changed
        await sequelize.sync({ alter: true });
        console.log('✅ Database Models Synced.');
    } catch (error) {
        console.error('❌ Database Connection Error:', error);
    }
};

module.exports = { sequelize, connectDB };