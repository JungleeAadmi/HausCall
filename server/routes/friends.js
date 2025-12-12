const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../utils/authMiddleware');
const { Op } = require('sequelize');

// @route   GET api/friends/search
// @desc    Search for users by username
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        // Find users matching username, exclude self
        const users = await User.findAll({
            where: {
                username: { [Op.like]: `%${query}%` },
                id: { [Op.ne]: req.user.id }
            },
            attributes: ['id', 'name', 'username', 'age', 'gender'] // Don't send password/friends
        });

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/friends/request
// @desc    Send Friend Request
router.post('/request', auth, async (req, res) => {
    try {
        const { targetId } = req.body;
        const targetUser = await User.findByPk(targetId);
        
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });

        // Check if already friends
        const currentUser = await User.findByPk(req.user.id);
        if (currentUser.friends.includes(targetId)) {
            return res.status(400).json({ msg: 'Already friends' });
        }

        // Add to target's request list
        let requests = targetUser.friendRequests;
        if (!requests.includes(req.user.id)) {
            requests.push(req.user.id);
            targetUser.friendRequests = requests;
            await targetUser.save();
        }

        res.json({ msg: 'Friend request sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/friends/accept
// @desc    Accept Friend Request
router.post('/accept', auth, async (req, res) => {
    try {
        const { requesterId } = req.body;
        
        const user = await User.findByPk(req.user.id);
        const requester = await User.findByPk(requesterId);

        if (!user || !requester) return res.status(404).json({ msg: 'User not found' });

        // 1. Add to User's friend list
        let userFriends = user.friends;
        if (!userFriends.includes(requesterId)) {
            userFriends.push(requesterId);
            user.friends = userFriends;
        }

        // 2. Remove from User's request list
        let userRequests = user.friendRequests;
        user.friendRequests = userRequests.filter(id => id !== requesterId);
        await user.save();

        // 3. Add to Requester's friend list
        let reqFriends = requester.friends;
        if (!reqFriends.includes(user.id)) {
            reqFriends.push(user.id);
            requester.friends = reqFriends;
            await requester.save();
        }

        res.json({ msg: 'Friend accepted', friend: {
            id: requester.id,
            name: requester.name,
            username: requester.username
        }});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/friends
// @desc    Get all friends and pending requests
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        // Fetch full friend objects
        const friends = await User.findAll({
            where: { id: user.friends },
            attributes: ['id', 'name', 'username', 'age', 'gender']
        });

        // Fetch full requester objects
        const requests = await User.findAll({
            where: { id: user.friendRequests },
            attributes: ['id', 'name', 'username', 'age', 'gender']
        });

        res.json({ friends, requests });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;