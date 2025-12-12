import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { FaVideo, FaPhone, FaUserPlus, FaCheck } from 'react-icons/fa';

const FriendList = ({ currentUser }) => {
    const { callUser } = useContext(SocketContext);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'pending', 'search'

    // Helper to get Auth Header
    const config = {
        headers: { 'x-auth-token': localStorage.getItem('token') }
    };
    
    // API URL Helper
    const apiBase = process.env.NODE_ENV === 'production' 
        ? '' 
        : `http://${window.location.hostname}:5000`;

    // Fetch Friends & Requests
    const fetchFriends = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/friends`, config);
            setFriends(res.data.friends);
            setRequests(res.data.requests);
        } catch (err) {
            console.error("Error fetching friends", err);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    // Search Users
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`${apiBase}/api/friends/search?query=${searchQuery}`, config);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Send Request
    const sendRequest = async (id) => {
        try {
            await axios.post(`${apiBase}/api/friends/request`, { targetId: id }, config);
            alert('Request Sent!');
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            alert(err.response?.data?.msg || 'Error sending request');
        }
    };

    // Accept Request
    const acceptRequest = async (id) => {
        try {
            await axios.post(`${apiBase}/api/friends/accept`, { requesterId: id }, config);
            fetchFriends(); // Refresh list
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                    className={`btn ${activeTab === 'friends' ? 'btn-primary' : ''}`} 
                    style={{ flex: 1, background: activeTab === 'friends' ? '' : '#333', color: 'white' }}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button 
                    className={`btn ${activeTab === 'pending' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, background: activeTab === 'pending' ? '' : '#333', color: 'white' }}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending {requests.length > 0 && `(${requests.length})`}
                </button>
                <button 
                    className={`btn ${activeTab === 'search' ? 'btn-primary' : ''}`}
                    style={{ flex: 1, background: activeTab === 'search' ? '' : '#333', color: 'white' }}
                    onClick={() => setActiveTab('search')}
                >
                    Add
                </button>
            </div>

            {/* --- FRIENDS TAB --- */}
            {activeTab === 'friends' && (
                <div>
                    {friends.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No friends yet.</p>}
                    {friends.map(friend => (
                        <div key={friend.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{friend.name}</h3>
                                <small style={{ color: '#888' }}>@{friend.username}</small>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => callUser(friend.id, 'audio')}
                                    style={{ background: '#333', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}
                                >
                                    <FaPhone />
                                </button>
                                <button 
                                    onClick={() => callUser(friend.id, 'video')}
                                    style={{ background: 'var(--primary)', border: 'none', color: 'black', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}
                                >
                                    <FaVideo />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- PENDING TAB --- */}
            {activeTab === 'pending' && (
                <div>
                    {requests.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No pending requests.</p>}
                    {requests.map(req => (
                        <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div>
                                <h3 style={{ margin: 0 }}>{req.name}</h3>
                                <small style={{ color: '#888' }}>@{req.username}</small>
                            </div>
                            <button 
                                className="btn-secondary" 
                                style={{ width: 'auto', padding: '8px 15px' }}
                                onClick={() => acceptRequest(req.id)}
                            >
                                Accept <FaCheck />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- SEARCH TAB --- */}
            {activeTab === 'search' && (
                <div>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Search Username..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn-primary" style={{ width: '80px', marginTop: '8px' }}>Go</button>
                    </form>
                    
                    <div style={{ marginTop: '15px' }}>
                        {searchResults.map(user => (
                            <div key={user.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{user.name}</h3>
                                    <small style={{ color: '#888' }}>@{user.username}</small>
                                </div>
                                <button 
                                    className="btn-secondary" 
                                    style={{ width: 'auto', padding: '8px' }}
                                    onClick={() => sendRequest(user.id)}
                                >
                                    <FaUserPlus /> Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default FriendList;