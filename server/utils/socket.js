const { sendCallNotification } = require('./ntfy');
const User = require('../models/User');

const onlineUsers = new Map();

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        
        // 1. Register User
        socket.on('register', (userId) => {
            if (!userId) return;
            onlineUsers.set(userId, socket.id);
            console.log(`🟢 User Online: ${userId} (Socket: ${socket.id})`);
            io.emit('online-users', Array.from(onlineUsers.keys()));
        });

        // 2. Handle Call Initiation
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
                // B. User is OFFLINE -> Send Ntfy Push Notification
                console.log(`User ${userToCall} is offline/background. Attempting Ntfy...`);
                try {
                    const targetUser = await User.findByPk(userToCall);
                    if (targetUser && targetUser.ntfyTopic) {
                        await sendCallNotification(
                            targetUser.ntfyTopic, 
                            name, 
                            type, 
                            targetUser.ntfyServer
                        );
                    }
                } catch (err) {
                    console.error("Error fetching user for notification:", err);
                }
            }
        });

        // 3. Handle Answering
        socket.on('answerCall', (data) => {
            console.log(`✅ Call Accepted by ${data.to}`);
            const callerSocketId = onlineUsers.get(data.to); // 'to' is the original caller
            if (callerSocketId) {
                io.to(callerSocketId).emit('callAccepted', data.signal);
            }
        });

        // 4. Handle Ending Call
        socket.on('endCall', ({ to }) => {
            const socketId = onlineUsers.get(to);
            if (socketId) {
                io.to(socketId).emit('callEnded');
            }
        });

        // 5. Handle Disconnect
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
};

module.exports = socketHandler;