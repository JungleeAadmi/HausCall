require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { connectDB } = require('./models/db');
const socketHandler = require('./utils/socket'); // Import the refactored logic

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database ---
connectDB();

// --- Routes ---
const authRoutes = require('./routes/auth');
const friendRoutes = require('./routes/friends');
const callRoutes = require('./routes/call'); // Use the new route

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/call', callRoutes);

// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// --- Socket.io Setup ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Initialize Socket Logic
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));