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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { navigate('/'); return; }
        
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        registerUser(parsedUser.id);
        
        setSettingsForm(prev => ({
            ...prev,
            ntfyServer: parsedUser.ntfyServer || 'https://ntfy.sh',
            ntfyTopic: parsedUser.ntfyTopic || ''
        }));
    }, [registerUser, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const apiBase = process.env.NODE_ENV === 'production' ? '' : `http://${window.location.hostname}:5000`;
    const config = { headers: { 'x-auth-token': localStorage.getItem('token') } };

    const saveSettings = async () => {
        try {
            const res = await axios.put(`${apiBase}/api/auth/update`, {
                ntfyServer: settingsForm.ntfyServer,
                ntfyTopic: settingsForm.ntfyTopic,
                password: settingsForm.password || undefined
            }, config);
            
            // Update local storage
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert("Settings Saved!");
            setSettingsForm(prev => ({...prev, password: ''}));
        } catch (err) {
            alert("Failed to save settings");
        }
    };

    const testNtfy = async () => {
        try {
            await axios.post(`${apiBase}/api/auth/test-ntfy`, {}, config);
            alert("Test Notification Sent! Check your Ntfy app.");
        } catch (err) {
            alert("Failed to send test notification.");
        }
    };

    const deleteAccount = async () => {
        if (settingsForm.deleteConfirm === 'DELETE') {
            try {
                await axios.delete(`${apiBase}/api/auth/delete`, config);
                handleLogout();
            } catch (err) { alert("Failed to delete"); }
        } else {
            alert("Please type DELETE to confirm.");
        }
    };

    if (!user) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <CallModal />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Hello, {user.name}</h2>
                    <small style={{ color: 'var(--text-muted)' }}>@{user.username}</small>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <FaCog size={24} style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setShowSettings(true)} />
                    <FaSignOutAlt size={24} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={handleLogout} />
                </div>
            </div>

            {/* Friend Management */}
            <FriendList currentUser={user} />

            {/* Settings Modal */}
            {showSettings && (
                <div className="call-modal" style={{ background: 'rgba(0,40,0,0.95)' }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', position: 'relative' }}>
                        <h2 style={{marginTop: 0}}>Settings</h2>
                        <button 
                            onClick={() => setShowSettings(false)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'white', fontSize: '20px' }}
                        >✕</button>

                        <label>Ntfy Server URL</label>
                        <input 
                            value={settingsForm.ntfyServer}
                            onChange={e => setSettingsForm({...settingsForm, ntfyServer: e.target.value})}
                        />

                        <label>Ntfy Topic</label>
                        <input 
                            value={settingsForm.ntfyTopic}
                            onChange={e => setSettingsForm({...settingsForm, ntfyTopic: e.target.value})}
                        />
                        
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button className="btn-secondary" onClick={saveSettings}><FaSave/> Save</button>
                            <button className="btn-primary" onClick={testNtfy}><FaBell/> Test</button>
                        </div>

                        <hr style={{ borderColor: '#004d00', margin: '20px 0' }} />

                        <label>Change Password</label>
                        <input 
                            type="password"
                            placeholder="New Password"
                            value={settingsForm.password}
                            onChange={e => setSettingsForm({...settingsForm, password: e.target.value})}
                        />
                        <button className="btn-secondary" onClick={saveSettings}>Update Password</button>

                        <hr style={{ borderColor: '#004d00', margin: '20px 0' }} />

                        <label style={{color: 'var(--danger)'}}>Delete Account</label>
                        <input 
                            placeholder="Type DELETE to confirm"
                            value={settingsForm.deleteConfirm}
                            onChange={e => setSettingsForm({...settingsForm, deleteConfirm: e.target.value})}
                        />
                        <button className="btn-danger" onClick={deleteAccount}><FaTrash/> Delete Forever</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;