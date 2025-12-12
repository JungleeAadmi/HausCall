const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../utils/authMiddleware');
const { Op, Sequelize } = require('sequelize');

// @route   GET api/friends/search
// @desc    Search for users by username OR name (Case Insensitive)
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const lowerQuery = query.toLowerCase();

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: req.user.id } }, // Exclude self
                    {
                        [Op.or]: [
                            // Search Username
                            Sequelize.where(
                                Sequelize.fn('lower', Sequelize.col('username')),
                                { [Op.like]: `%${lowerQuery}%` }
                            ),
                            // Search Name
                            Sequelize.where(
                                Sequelize.fn('lower', Sequelize.col('name')),
                                { [Op.like]: `%${lowerQuery}%` }
                            )
                        ]
                    }
                ]
            },
            attributes: ['id', 'name', 'username', 'age', 'gender']
        });

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/friends/request
router.post('/request', auth, async (req, res) => {
    try {
        const { targetId } = req.body;
        const targetUser = await User.findByPk(targetId);
        
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });

        const currentUser = await User.findByPk(req.user.id);
        if (currentUser.friends.includes(targetId)) {
            return res.status(400).json({ msg: 'Already friends' });
        }

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
router.post('/accept', auth, async (req, res) => {
    try {
        const { requesterId } = req.body;
        
        const user = await User.findByPk(req.user.id);
        const requester = await User.findByPk(requesterId);

        if (!user || !requester) return res.status(404).json({ msg: 'User not found' });

        // Update User
        let userFriends = user.friends;
        if (!userFriends.includes(requesterId)) userFriends.push(requesterId);
        user.friends = userFriends;
        user.friendRequests = user.friendRequests.filter(id => id !== requesterId);
        await user.save();

        // Update Requester
        let reqFriends = requester.friends;
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
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if(!user) return res.status(404).json({msg: 'User not found'});

        const friends = await User.findAll({
            where: { id: user.friends },
            attributes: ['id', 'name', 'username', 'age', 'gender']
        });
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