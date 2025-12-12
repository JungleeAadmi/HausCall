require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDB } = require('./models/db');
const { sendCallNotification } = require('./utils/ntfy');
const User = require('./models/User'); // Import User model to look up ntfy topics

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database ---
connectDB();

// --- Routes (We will enable these in the next step) ---
// const authRoutes = require('./routes/auth');
// const friendRoutes = require('./routes/friends');
// app.use('/api/auth', authRoutes);
// app.use('/api/friends', friendRoutes);

// --- Simple Health Check ---
app.get('/', (req, res) => {
    res.send('HausCall Server is Running.');
});

// --- Socket.io (Real-time Calling) ---
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for local network ease
        methods: ["GET", "POST"]
    }
});

// Map to store online users: { userId: socketId }
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
            // A. User is ONLINE -> Ring them directly via WebSocket
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
                // Fetch the destination user's ntfy topic from DB
                const targetUser = await User.findByPk(userToCall);
                if (targetUser && targetUser.ntfyTopic) {
                    await sendCallNotification(targetUser.ntfyTopic, name, type);
                } else {
                    console.log("⚠️ No Ntfy topic found for user.");
                }
            } catch (err) {
                console.error("Error fetching user for notification:", err);
            }
        }
    });

    // 3. Answering a Call
    socket.on('answerCall', (data) => {
        console.log(`✅ Call Accepted by ${data.to}`);
        // Send the signaling data back to the caller so WebRTC connects
        const callerSocketId = onlineUsers.get(data.to); // 'to' here is the original caller ID
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

    // 5. User Disconnects
    socket.on('disconnect', () => {
        // Find userId by socketId and remove
        for (let [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                console.log(`🔴 User Offline: ${uid}`);
                break;
            }
        }
        io.emit('online-users', Array.from(onlineUsers.keys()));
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));