import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        age: '',
        gender: 'Not Specified'
    });
    const [error, setError] = useState('');

    const { name, username, password, age, gender } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        
        const apiBase = process.env.NODE_ENV === 'production' 
            ? '' 
            : `http://${window.location.hostname}:5000`;

        try {
            const res = await axios.post(`${apiBase}/api/auth/register`, formData);
            
            // Auto-login after registration
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Registration Failed');
        }
    };

    return (
        <div className="container" style={{ justifyContent: 'center' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center' }}>Join HausCall</h2>
                {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
                
                <form onSubmit={onSubmit}>
                    <input 
                        type="text" 
                        placeholder="Full Name" 
                        name="name" 
                        value={name} 
                        onChange={onChange} 
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Username (Unique)" 
                        name="username" 
                        value={username} 
                        onChange={onChange} 
                        required 
                    />
                    <input 
                        type="number" 
                        placeholder="Age" 
                        name="age" 
                        value={age} 
                        onChange={onChange} 
                        required 
                    />
                    
                    <select 
                        name="gender" 
                        value={gender} 
                        onChange={onChange}
                        style={{
                            width: '100%',
                            padding: '12px',
                            margin: '8px 0',
                            background: '#2c2c2c',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            color: 'white'
                        }}
                    >
                        <option value="Not Specified">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                    </select>

                    <input 
                        type="password" 
                        placeholder="Password" 
                        name="password" 
                        value={password} 
                        onChange={onChange} 
                        required 
                    />
                    
                    <button type="submit" className="btn btn-secondary">Create Account</button>
                </form>

                <p style={{ marginTop: '15px', textAlign: 'center', color: '#888' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)' }}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;