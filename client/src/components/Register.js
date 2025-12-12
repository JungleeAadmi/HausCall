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
        <div className="container">
            <div className="card">
                 <h2 style={{marginTop: 0}}>Create Account</h2>
                {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
                
                <form onSubmit={onSubmit}>
                    <label>Full Name</label>
                    <input type="text" name="name" value={name} onChange={onChange} required />
                    
                    <label>Username</label>
                    <input type="text" name="username" value={username} onChange={onChange} required />
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{flex: 1}}>
                            <label>Age</label>
                            <input type="number" name="age" value={age} onChange={onChange} required />
                        </div>
                        <div style={{flex: 1}}>
                            <label>Gender</label>
                            <select name="gender" value={gender} onChange={onChange} style={{marginTop: '0'}}>
                                <option value="Not Specified">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <label>Password</label>
                    <input type="password" name="password" value={password} onChange={onChange} required />
                    
                    <button type="submit" className="btn btn-primary">Sign Up</button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
                    Have an account? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;