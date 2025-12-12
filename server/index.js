require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { connectDB } = require('./models/db');
const { sendCallNotification } = require('./utils/ntfy');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

connectDB();

const authRoutes = require('./routes/auth');
const friendRoutes = require('./routes/friends');

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
    
    socket.on('register', (userId) => {
        if (!userId) return;
        onlineUsers.set(userId, socket.id);
        console.log(`🟢 User Online: ${userId}`);
        io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    socket.on('callUser', async ({ userToCall, signalData, from, name, type }) => {
        console.log(`📞 Call initiated: ${name} -> ${userToCall}`);
        
        const socketIdToCall = onlineUsers.get(userToCall);

        if (socketIdToCall) {
            io.to(socketIdToCall).emit('callUser', { signal: signalData, from, name, type });
        } else {
            console.log(`User ${userToCall} is offline. Attempting Ntfy...`);
            try {
                const targetUser = await User.findByPk(userToCall);
                if (targetUser && targetUser.ntfyTopic) {
                    // PASS THE CUSTOM SERVER URL HERE
                    await sendCallNotification(targetUser.ntfyTopic, name, type, targetUser.ntfyServer);
                }
            } catch (err) {
                console.error("Error fetching user for notification:", err);
            }
        }
    });

    socket.on('answerCall', (data) => {
        const callerSocketId = onlineUsers.get(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('callAccepted', data.signal);
        }
    });

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