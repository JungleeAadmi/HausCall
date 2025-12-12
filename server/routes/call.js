const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');

// @route   GET api/call/status
// @desc    Check if call service is active
router.get('/status', auth, (req, res) => {
    res.json({ msg: 'Call Service is Active', user: req.user.id });
});

// @route   POST api/call/log
// @desc    Log call events (Optional for future analytics)
router.post('/log', auth, (req, res) => {
    const { event, targetId } = req.body;
    console.log(`[Call Log] User ${req.user.id} - ${event} - Target: ${targetId}`);
    res.json({ status: 'logged' });
});

module.exports = router;