require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path'); // Added path module
const { Server } = require('socket.io');
const { connectDB } = require('./models/db');
const { sendCallNotification } = require('./utils/ntfy');
const User = require('./models/User');

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

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);

// --- SERVE FRONTEND (This is the fix) ---
// 1. Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// 2. Handle React Routing, return all other requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// --- Socket.io (Real-time Calling) ---
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
    
    // 1. User comes online
    socket.on('register', (userId) => {
        if (!userId) return;
        onlineUsers.set(userId, socket.id);
        console.log(`🟢 User Online: ${userId} (Socket: ${socket.id})`);
        io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // 2. Initiating a Call
    socket.on('callUser', async ({ userToCall, signalData, from, name, type }) => {
        console.log(`📞 Call initiated: ${name} -> ${userToCall}`);
        
        const socketIdToCall = onlineUsers.get(userToCall);

        if (socketIdToCall) {
            // A. User is ONLINE
            io.to(socketIdToCall).emit('callUser', { 
                signal: signalData, 
                from, 
                name,
                type 
            });
        } else {
            // B. User is OFFLINE -> Send Notification via Ntfy
            console.log(`User ${userToCall} is offline/background. Attempting Ntfy...`);
            
            try {
                const targetUser = await User.findByPk(userToCall);
                if (targetUser && targetUser.ntfyTopic) {
                    await sendCallNotification(targetUser.ntfyTopic, name, type);
                }
            } catch (err) {
                console.error("Error fetching user for notification:", err);
            }
        }
    });

    // 3. Answering a Call
    socket.on('answerCall', (data) => {
        console.log(`✅ Call Accepted by ${data.to}`);
        const callerSocketId = onlineUsers.get(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('callAccepted', data.signal);
        }
    });

    // 4. Ending a Call
    socket.on('endCall', ({ to }) => {
        const socketId = onlineUsers.get(to);
        if (socketId) {
            io.to(socketId).emit('callEnded');
        }
    });

    socket.on('disconnect', () => {
        for (let [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                break;
            }
        }
        io.emit('online-users', Array.from(onlineUsers.keys()));
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));