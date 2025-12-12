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
        // Persistence: Check localStorage
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

    const handleLogout = () => {
        // Explicit logout clears storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Force reload to clear socket state
        window.location.href = '/';
    };

    const apiBase = process.env.NODE_ENV === 'production' ? '' : `http://${window.location.hostname}:5000`;
    const config = { headers: { 'x-auth-token': localStorage.getItem('token') } };

    const saveSettings = async () => {
        try {
            const payload = {
                ntfyServer: settingsForm.ntfyServer,
                ntfyTopic: settingsForm.ntfyTopic,
            };
            // Only add password if typed
            if(settingsForm.password.trim()) {
                payload.password = settingsForm.password;
            }

            const res = await axios.put(`${apiBase}/api/auth/update`, payload, config);
            
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert("Settings Saved!");
            setSettingsForm(prev => ({...prev, password: ''}));
        } catch (err) {
            console.error(err);
            alert("Failed to save settings: " + (err.response?.data?.msg || err.message));
        }
    };

    const testNtfy = async () => {
        try {
            await axios.post(`${apiBase}/api/auth/test-ntfy`, {}, config);
            alert("Test Notification Sent!");
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

    if (!user) return <div className="container" style={{justifyContent:'center', textAlign:'center'}}>Loading...</div>;

    return (
        <div className="container" style={{justifyContent:'flex-start', paddingTop: '40px'}}>
            <CallModal />

            {/* Professional Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        background: '#14532d', 
                        width: '45px', 
                        height: '45px', 
                        borderRadius: '12px', 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', textAlign:'left', marginBottom:'2px' }}>{user.name}</h2>
                        <small style={{ color: 'var(--text-muted)' }}>@{user.username}</small>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <FaCog size={22} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => setShowSettings(true)} />
                    <FaSignOutAlt size={22} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={handleLogout} />
                </div>
            </div>

            {/* Main Content */}
            <FriendList currentUser={user} />

            {/* Settings Modal */}
            {showSettings && (
                <div className="call-modal" style={{ background: 'rgba(0,0,0,0.9)' }}>
                    <div className="container" style={{justifyContent: 'center'}}>
                        <div className="card" style={{ position: 'relative' }}>
                            <h2 style={{marginTop: 0, fontSize: '1.2rem'}}>Settings</h2>
                            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor:'pointer' }}>✕</button>

                            <label>Ntfy Server</label>
                            <input value={settingsForm.ntfyServer} onChange={e => setSettingsForm({...settingsForm, ntfyServer: e.target.value})} />

                            <label>Ntfy Topic</label>
                            <input value={settingsForm.ntfyTopic} onChange={e => setSettingsForm({...settingsForm, ntfyTopic: e.target.value})} />
                            
                            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                <button className="btn btn-secondary" onClick={saveSettings} style={{margin:0}}><FaSave/> Save</button>
                                <button className="btn btn-primary" onClick={testNtfy} style={{margin:0}}><FaBell/> Test</button>
                            </div>

                            <hr style={{ borderColor: '#333', margin: '20px 0' }} />

                            <label>New Password (Optional)</label>
                            <input type="password" placeholder="Leave blank to keep current" value={settingsForm.password} onChange={e => setSettingsForm({...settingsForm, password: e.target.value})} />
                            
                            <label style={{color: 'var(--danger)', marginTop: '20px'}}>Delete Account</label>
                            <input placeholder="Type DELETE to confirm" value={settingsForm.deleteConfirm} onChange={e => setSettingsForm({...settingsForm, deleteConfirm: e.target.value})} style={{borderColor: 'var(--danger)'}} />
                            <button className="btn btn-danger" onClick={deleteAccount} style={{marginTop:'10px'}}><FaTrash/> Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;