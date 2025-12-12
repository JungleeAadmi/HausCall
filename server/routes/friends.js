const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../utils/authMiddleware');
const { Op, Sequelize } = require('sequelize');

// @route   GET api/friends/search
// @desc    Search for users by username or name (Case Insensitive)
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') {
            return res.json([]); 
        }

        const lowerQuery = query.toLowerCase();
        console.log(`🔍 Searching for: ${lowerQuery} by User: ${req.user.id}`);

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: req.user.id } }, // Exclude self
                    {
                        [Op.or]: [
                            // Match partial username
                            Sequelize.where(
                                Sequelize.fn('lower', Sequelize.col('username')),
                                { [Op.like]: `%${lowerQuery}%` }
                            ),
                            // Match partial real name
                            Sequelize.where(
                                Sequelize.fn('lower', Sequelize.col('name')),
                                { [Op.like]: `%${lowerQuery}%` }
                            )
                        ]
                    }
                ]
            },
            attributes: ['id', 'name', 'username', 'age', 'gender'] // Sensitive data excluded
        });

        console.log(`✅ Found ${users.length} users`);
        res.json(users);
    } catch (err) {
        console.error("❌ Search Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/friends/request
// @desc    Send a friend request
router.post('/request', auth, async (req, res) => {
    try {
        const { targetId } = req.body;
        const targetUser = await User.findByPk(targetId);
        
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });

        const currentUser = await User.findByPk(req.user.id);
        
        // Check if already friends
        if (currentUser.friends.includes(targetId)) {
            return res.status(400).json({ msg: 'Already friends' });
        }

        // Add to requests
        let requests = targetUser.friendRequests || [];
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
// @desc    Accept a friend request
router.post('/accept', auth, async (req, res) => {
    try {
        const { requesterId } = req.body;
        
        const user = await User.findByPk(req.user.id);
        const requester = await User.findByPk(requesterId);

        if (!user || !requester) return res.status(404).json({ msg: 'User not found' });

        // Update User's list
        let userFriends = user.friends || [];
        if (!userFriends.includes(requesterId)) userFriends.push(requesterId);
        user.friends = userFriends;
        
        // Remove from requests
        let userRequests = user.friendRequests || [];
        user.friendRequests = userRequests.filter(id => id !== requesterId);
        await user.save();

        // Update Requester's list
        let reqFriends = requester.friends || [];
        if (!reqFriends.includes(user.id)) reqFriends.push(user.id);
        requester.friends = reqFriends;
        await requester.save();

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
// @desc    Get friend list and pending requests
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if(!user) return res.status(404).json({msg: 'User not found'});

        // Handle empty lists safely
        const friendIds = user.friends || [];
        const requestIds = user.friendRequests || [];

        const friends = await User.findAll({
            where: { id: friendIds },
            attributes: ['id', 'name', 'username', 'age', 'gender']
        });
        
        const requests = await User.findAll({
            where: { id: requestIds },
            attributes: ['id', 'name', 'username', 'age', 'gender']
        });
        
        res.json({ friends, requests });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;