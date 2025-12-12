import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', username: '', password: '', age: '', gender: 'Not Specified'
    });
    const [error, setError] = useState('');

    const { name, username, password, age, gender } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        const apiBase = process.env.NODE_ENV === 'production' ? '' : `http://${window.location.hostname}:5000`;
        try {
            const res = await axios.post(`${apiBase}/api/auth/register`, formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration Failed');
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
                <h2>Join HausCall</h2>
                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                
                <form onSubmit={onSubmit}>
                    <input type="text" placeholder="Full Name" name="name" value={name} onChange={onChange} required />
                    <input type="text" placeholder="Username (Unique)" name="username" value={username} onChange={onChange} required />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="number" placeholder="Age" name="age" value={age} onChange={onChange} required style={{flex: 1}}/>
                        <select name="gender" value={gender} onChange={onChange} style={{flex: 1}}>
                            <option value="Not Specified">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required />
                    <button type="submit" className="btn btn-secondary">Create Account</button>
                </form>

                <p style={{ marginTop: '20px', color: '#888' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;