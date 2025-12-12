import React, { useEffect, useContext, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import FriendList from './FriendList';
import CallModal from './CallModal';

const Dashboard = () => {
    const { registerUser, me } = useContext(SocketContext);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 1. Load User Data from LocalStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // 2. Connect to Socket Server
        // We pass the DB ID so the server knows who 'socket.id' belongs to
        registerUser(parsedUser.id);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    if (!user) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            {/* The Call Modal is always mounted but hidden until a call starts */}
            <CallModal />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Hello, {user.name}</h2>
                    <small style={{ color: 'var(--text-muted)' }}>@{user.username}</small>
                </div>
                <button 
                    onClick={handleLogout} 
                    style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '5px 10px', borderRadius: '4px' }}
                >
                    Logout
                </button>
            </div>

            {/* Ntfy Info Box */}
            <div className="card" style={{ background: '#222', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>🔔 Notification Setup:</strong><br/>
                    Subscribe to this topic in your Ntfy app:<br/>
                    <code style={{ color: 'var(--secondary)' }}>{user.ntfyTopic}</code>
                </p>
            </div>

            {/* Friend Management Section */}
            <FriendList currentUser={user} />

        </div>
    );
};

export default Dashboard;