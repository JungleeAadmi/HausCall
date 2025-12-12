import React, { useEffect, useContext, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FriendList from './FriendList';
import CallModal from './CallModal';
import { FaSignOutAlt, FaCog, FaTrash, FaSave, FaBell } from 'react-icons/fa';

const Dashboard = () => {
    const { registerUser } = useContext(SocketContext);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    
    // Settings Form State
    const [settingsForm, setSettingsForm] = useState({
        ntfyServer: 'https://ntfy.sh',
        ntfyTopic: '',
        password: '',
        deleteConfirm: ''
    });

    // Helper: Logout and Redirect
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { 
            navigate('/'); 
            return; 
        }
        
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        registerUser(parsedUser.id);
        
        setSettingsForm(prev => ({
            ...prev,
            ntfyServer: parsedUser.ntfyServer || 'https://ntfy.sh',
            ntfyTopic: parsedUser.ntfyTopic || ''
        }));
    }, [registerUser, navigate]);

    const apiBase = process.env.NODE_ENV === 'production' ? '' : `http://${window.location.hostname}:5000`;
    const config = { headers: { 'x-auth-token': localStorage.getItem('token') } };

    const saveSettings = async () => {
        try {
            const payload = {
                ntfyServer: settingsForm.ntfyServer,
                ntfyTopic: settingsForm.ntfyTopic,
            };
            // Only send password if user typed something
            if(settingsForm.password && settingsForm.password.trim().length > 0) {
                payload.password = settingsForm.password;
            }

            const res = await axios.put(`${apiBase}/api/auth/update`, payload, config);
            
            // Update local storage
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            alert("Settings Saved Successfully!");
            setSettingsForm(prev => ({...prev, password: ''}));
        } catch (err) {
            console.error(err);
            // Handle Invalid Token (e.g. DB Reset)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert("Session expired or invalid. Logging out.");
                handleLogout();
            } else {
                alert("Failed to save: " + (err.response?.data?.msg || err.message));
            }
        }
    };

    const testNtfy = async () => {
        try {
            await axios.post(`${apiBase}/api/auth/test-ntfy`, {}, config);
            alert("Test Notification Sent! Check your device.");
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                alert("Session expired. Logging out.");
                handleLogout();
            } else {
                alert("Failed to send test notification.");
            }
        }
    };

    const deleteAccount = async () => {
        if (settingsForm.deleteConfirm === 'DELETE') {
            try {
                await axios.delete(`${apiBase}/api/auth/delete`, config);
                handleLogout();
            } catch (err) { alert("Failed to delete account"); }
        } else {
            alert("Please type DELETE to confirm.");
        }
    };

    if (!user) return <div className="container" style={{justifyContent:'center', alignItems:'center'}}>Loading...</div>;

    return (
        <div className="container" style={{ justifyContent: 'flex-start' }}>
            <CallModal />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        background: '#15803d', 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(21, 128, 61, 0.4)'
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', textAlign:'left' }}>{user.name}</h2>
                        <small style={{ color: '#9ca3af' }}>@{user.username}</small>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <FaCog size={22} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowSettings(true)} />
                    <FaSignOutAlt size={22} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={handleLogout} />
                </div>
            </div>

            {/* Friend List (Main Content) */}
            <FriendList currentUser={user} />

            {/* Settings Modal */}
            {showSettings && (
                <div className="call-modal" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}>
                    <div className="container" style={{justifyContent: 'center'}}>
                        <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>Settings</h2>
                            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor:'pointer' }}>✕</button>

                            <label>Ntfy Server</label>
                            <input value={settingsForm.ntfyServer} onChange={e => setSettingsForm({...settingsForm, ntfyServer: e.target.value})} placeholder="https://ntfy.sh" />

                            <label>Ntfy Topic</label>
                            <input value={settingsForm.ntfyTopic} onChange={e => setSettingsForm({...settingsForm, ntfyTopic: e.target.value})} />
                            
                            <div style={{display: 'flex', gap: '12px', marginTop: '15px'}}>
                                <button className="btn btn-primary" onClick={saveSettings} style={{margin:0}}><FaSave/> Save</button>
                                <button className="btn btn-secondary" onClick={testNtfy} style={{margin:0}}><FaBell/> Test</button>
                            </div>

                            <hr style={{ borderColor: '#333', margin: '24px 0' }} />

                            <label>New Password (Optional)</label>
                            <input type="password" placeholder="Leave blank to keep current" value={settingsForm.password} onChange={e => setSettingsForm({...settingsForm, password: e.target.value})} />
                            
                            <label style={{color: '#ef4444', marginTop: '24px'}}>Delete Account</label>
                            <input placeholder="Type DELETE to confirm" value={settingsForm.deleteConfirm} onChange={e => setSettingsForm({...settingsForm, deleteConfirm: e.target.value})} style={{borderColor: '#ef4444'}} />
                            <button className="btn btn-danger" onClick={deleteAccount} style={{marginTop:'12px'}}><FaTrash/> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;