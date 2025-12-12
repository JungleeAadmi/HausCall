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
            setFriends(res.data.friends);
            setRequests(res.data.requests);
        } catch (err) { console.error("Error fetching friends", err); }
    };

    useEffect(() => { fetchFriends(); }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if(!searchQuery.trim()) return;
        try {
            const res = await axios.get(`${apiBase}/api/friends/search?query=${searchQuery}`, config);
            setSearchResults(res.data);
            if(res.data.length === 0) alert("No users found. Try a different username.");
        } catch (err) { console.error(err); }
    };

    const sendRequest = async (id) => {
        try {
            await axios.post(`${apiBase}/api/friends/request`, { targetId: id }, config);
            alert('Request Sent!');
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) { alert(err.response?.data?.msg || 'Error sending request'); }
    };

    const acceptRequest = async (id) => {
        try {
            await axios.post(`${apiBase}/api/friends/accept`, { requesterId: id }, config);
            fetchFriends();
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            {/* CONTENT AREA */}
            <div style={{ paddingBottom: '20px' }}>
                
                {/* FRIENDS TAB */}
                {activeTab === 'friends' && (
                    <div>
                        <h3 style={{ borderBottom: '1px solid #14532d', paddingBottom: '10px' }}>Friends</h3>
                        {friends.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>No friends yet.<br/>Go to 'Add' to find people.</p>}
                        {friends.map(friend => (
                            <div key={friend.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                                <div style={{display:'flex', alignItems:'center', gap: '15px'}}>
                                    <div style={{width: '40px', height: '40px', background: '#14532d', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1.2rem'}}>
                                        {friend.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{friend.name}</h4>
                                        <small style={{ color: '#888' }}>@{friend.username}</small>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={() => callUser(friend.id, 'audio')} style={{ background: '#333', border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <FaPhone />
                                    </button>
                                    <button onClick={() => callUser(friend.id, 'video')} style={{ background: 'var(--primary)', border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <FaVideo />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PENDING TAB */}
                {activeTab === 'pending' && (
                    <div>
                        <h3 style={{ borderBottom: '1px solid #14532d', paddingBottom: '10px' }}>Pending Requests</h3>
                        {requests.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>No pending requests.</p>}
                        {requests.map(req => (
                            <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div>
                                    <h4 style={{ margin: 0 }}>{req.name}</h4>
                                    <small style={{ color: '#888' }}>@{req.username}</small>
                                </div>
                                <button className="btn-secondary" style={{ width: 'auto', padding: '8px 15px' }} onClick={() => acceptRequest(req.id)}>
                                    Accept <FaCheck />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* SEARCH TAB */}
                {activeTab === 'search' && (
                    <div>
                         <h3 style={{ borderBottom: '1px solid #14532d', paddingBottom: '10px' }}>Add Friends</h3>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="Search Username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button type="submit" className="btn-primary" style={{ width: '60px', marginTop: '10px' }}><FaSearch/></button>
                        </form>
                        
                        <div style={{ marginTop: '20px' }}>
                            {searchResults.map(user => (
                                <div key={user.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{user.name}</h4>
                                        <small style={{ color: '#888' }}>@{user.username}</small>
                                    </div>
                                    <button className="btn-secondary" style={{ width: 'auto', padding: '8px 15px' }} onClick={() => sendRequest(user.id)}>
                                        <FaUserPlus /> Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM NAVIGATION BAR */}
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