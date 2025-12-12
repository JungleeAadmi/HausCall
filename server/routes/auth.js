const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
    const { name, username, password, age, gender } = req.body;

    try {
        let user = await User.findOne({ where: { username } });
        if (user) {
            return res.status(400).json({ msg: 'Username already taken' });
        }

        // Auto-generate a secure ntfy topic
        const ntfyTopic = `hauscall_${username}_${uuidv4().slice(0, 8)}`;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            username,
            password: hashedPassword,
            age,
            gender,
            ntfyTopic
        });

        const payload = { user: { id: user.id } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '365d' }, // Login lasts 1 year for convenience
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name, username, age, gender, ntfyTopic } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '365d' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        username: user.username, 
                        age: user.age, 
                        gender: user.gender,
                        ntfyTopic: user.ntfyTopic 
                    } 
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;