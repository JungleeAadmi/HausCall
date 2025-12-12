import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const { username, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        const apiBase = process.env.NODE_ENV === 'production' ? '' : `http://${window.location.hostname}:5000`;
        try {
            const res = await axios.post(`${apiBase}/api/auth/login`, formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login Failed');
        }
    };

    return (
        <div className="container" style={{ justifyContent: 'center' }}>
            <div className="card" style={{ textAlign: 'center' }}>
                {/* LOGO ADDED HERE */}
                <img 
                    src={process.env.PUBLIC_URL + '/android-chrome-192x192.png'} 
                    alt="Logo" 
                    style={{ width: '80px', marginBottom: '10px', borderRadius: '15px' }}
                />
                
                <h2>HausCall Login</h2>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                
                <form onSubmit={onSubmit}>
                    <input type="text" placeholder="Username" name="username" value={username} onChange={onChange} required />
                    <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required />
                    <button type="submit" className="btn btn-primary">Login</button>
                </form>
                
                <p style={{ marginTop: '20px', color: '#888' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;