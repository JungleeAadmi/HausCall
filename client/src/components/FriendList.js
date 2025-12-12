import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { FaVideo, FaPhone, FaUserPlus, FaCheck, FaUsers, FaClock, FaSearch } from 'react-icons/fa';

const FriendList = ({ currentUser }) => {
    const { callUser } = useContext(SocketContext);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeTab, setActiveTab] = useState('friends');

    const config = { headers: { 'x-auth-token': localStorage.getItem('token') } };
    const apiBase = process.env.NODE_ENV === 'production' ? '' : `http://${window.location.hostname}:5000`;

    const fetchFriends = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/friends`, config);
            setFriends(res.data.friends || []);
            setRequests(res.data.requests || []);
        } catch (err) { console.error("Error fetching friends", err); }
    };

    useEffect(() => { fetchFriends(); }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if(!searchQuery.trim()) return;
        try {
            const res = await axios.get(`${apiBase}/api/friends/search?query=${searchQuery}`, config);
            setSearchResults(res.data);
            if(res.data.length === 0) alert("No users found. Try searching by name or username.");
        } catch (err) { console.error(err); }
    };

    const sendRequest = async (id) => {
        try {
            await axios.post(`${apiBase}/api/friends/request`, { targetId: id }, config);
            alert('Request Sent!');
            setSearchQuery('');
            setSearchResults([]);
            setActiveTab('pending'); // Switch tab to see progress
        } catch (err) { alert(err.response?.data?.msg || 'Error sending request'); }
    };

    const acceptRequest = async (id) => {
        try {
            await axios.post(`${apiBase}/api/friends/accept`, { requesterId: id }, config);
            fetchFriends();
            alert("Friend Accepted!");
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            <div style={{ paddingBottom: '20px' }}>
                
                {/* --- FRIENDS TAB --- */}
                {activeTab === 'friends' && (
                    <div>
                        <h3>My Friends</h3>
                        {friends.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '60px', opacity: 0.6 }}>
                                <p>No friends yet.</p>
                                <p>Tap "Add" below to find people.</p>
                            </div>
                        )}
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '15px' }}>
                            {friends.map(friend => (
                                <div key={friend.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: 0 }}>
                                    <div style={{display:'flex', alignItems:'center', gap: '15px'}}>
                                        <div style={{width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                                            {friend.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'white' }}>{friend.name}</h4>
                                            <small>@{friend.username}</small>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => callUser(friend.id, 'audio')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc' }}>
                                            <FaPhone />
                                        </button>
                                        <button onClick={() => callUser(friend.id, 'video')} className="btn-icon" style={{ background: 'var(--primary)', color: 'black' }}>
                                            <FaVideo />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- PENDING TAB --- */}
                {activeTab === 'pending' && (
                    <div>
                        <h3>Pending Requests</h3>
                        {requests.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>No pending requests.</p>}
                        
                        <div>
                            {requests.map(req => (
                                <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: '10px' }}>
                                     <div>
                                        <h4 style={{ margin: 0, color: 'white' }}>{req.name}</h4>
                                        <small>@{req.username}</small>
                                    </div>
                                    <button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }} onClick={() => acceptRequest(req.id)}>
                                        Accept <FaCheck />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SEARCH TAB --- */}
                {activeTab === 'search' && (
                    <div>
                         <h3>Add New Friend</h3>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                placeholder="Search Name or Username..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-icon" style={{ background: 'var(--primary)', color: 'black', width: '54px', height: '54px' }}>
                                <FaSearch/>
                            </button>
                        </form>
                        
                        <div style={{ marginTop: '20px' }}>
                            {searchResults.map(user => (
                                <div key={user.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: '10px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'white' }}>{user.name}</h4>
                                        <small>@{user.username}</small>
                                    </div>
                                    <button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }} onClick={() => sendRequest(user.id)}>
                                        <FaUserPlus /> Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- BOTTOM NAV --- */}
            <div className="bottom-nav">
                <button className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                    <FaUsers className="nav-icon" />
                    <span>Friends</span>
                </button>
                <button className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    <FaClock className="nav-icon" />
                    <span>Pending {requests.length > 0 && `(${requests.length})`}</span>
                </button>
                <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
                    <FaUserPlus className="nav-icon" />
                    <span>Add</span>
                </button>
            </div>
        </div>
    );
};

export default FriendList;