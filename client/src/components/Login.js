import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if(localStorage.getItem('token')) navigate('/dashboard');
    }, [navigate]);

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
        <div className="container" style={{justifyContent: 'center'}}>
            <div className="card" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '20px', 
                        margin: '0 auto', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <img 
                            src={process.env.PUBLIC_URL + '/android-chrome-192x192.png'} 
                            alt="Logo" 
                            style={{ width: '50px' }}
                        />
                    </div>
                </div>

                <h2 style={{ textAlign: 'center' }}>HausCall Login</h2>
                {error && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>}
                
                <form onSubmit={onSubmit}>
                    <label>Username</label>
                    <input type="text" name="username" value={username} onChange={onChange} required />
                    
                    <label>Password</label>
                    <input type="password" name="password" value={password} onChange={onChange} required />
                    
                    <button type="submit" className="btn btn-primary">Sign In</button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.9rem', color: '#9ca3af' }}>
                    New here? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;