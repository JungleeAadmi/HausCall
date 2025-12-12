const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const auth = require('../utils/authMiddleware');

// Register
router.post('/register', async (req, res) => {
    const { name, username, password, age, gender } = req.body;
    try {
        let user = await User.findOne({ where: { username } });
        if (user) return res.status(400).json({ msg: 'Username taken' });

        const ntfyTopic = `hauscall_${username}_${uuidv4().slice(0, 8)}`;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name, username, password: hashedPassword, age, gender, ntfyTopic
        });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '365d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user });
        });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '365d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user });
        });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Update Settings
router.put('/update', auth, async (req, res) => {
    const { ntfyTopic, ntfyServer, password } = req.body;
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update Ntfy Settings
        if (ntfyTopic !== undefined) user.ntfyTopic = ntfyTopic;
        if (ntfyServer !== undefined) user.ntfyServer = ntfyServer;
        
        // Update Password ONLY if provided and valid
        if (password && typeof password === 'string' && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        
        await user.save();
        
        // Return user without password
        const userObj = user.toJSON();
        delete userObj.password;
        
        res.json({ msg: 'Profile Updated', user: userObj });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ msg: 'Server Error during update' });
    }
});

// Delete Account
router.delete('/delete', auth, async (req, res) => {
    try {
        await User.destroy({ where: { id: req.user.id } });
        res.json({ msg: 'Account Deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Test Ntfy
router.post('/test-ntfy', auth, async (req, res) => {
    const { sendCallNotification } = require('../utils/ntfy');
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        await sendCallNotification(user.ntfyTopic, "Test", "test", user.ntfyServer);
        res.json({ msg: 'Notification Sent' });
    } catch (err) {
        console.error("Test Ntfy Error:", err);
        res.status(500).json({ msg: 'Failed to send' });
    }
});

module.exports = router;