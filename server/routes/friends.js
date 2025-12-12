const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../utils/authMiddleware');
const { Op, Sequelize } = require('sequelize');

router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        // DEBUG LOG
        console.log(`🔎 SEARCH HIT: User ${req.user.id} searching for '${query}'`);

        if (!query || query.trim() === '') return res.json([]); 

        const lowerQuery = query.toLowerCase();

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: req.user.id } },
                    {
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('username')), { [Op.like]: `%${lowerQuery}%` }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), { [Op.like]: `%${lowerQuery}%` })
                        ]
                    }
                ]
            },
            attributes: ['id', 'name', 'username']
        });

        console.log(`✅ Found ${users.length} users`);
        res.json(users);
    } catch (err) {
        console.error("❌ Search Error:", err);
        res.status(500).send('Server Error');
    }
});

// ... Keep existing request/accept/list routes standard ...
router.post('/request', auth, async (req, res) => {
    try {
        const { targetId } = req.body;
        const targetUser = await User.findByPk(targetId);
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });
        const currentUser = await User.findByPk(req.user.id);
        if (currentUser.friends.includes(targetId)) return res.status(400).json({ msg: 'Already friends' });
        let requests = targetUser.friendRequests || [];
        if (!requests.includes(req.user.id)) {
            requests.push(req.user.id);
            targetUser.friendRequests = requests;
            await targetUser.save();
        }
        res.json({ msg: 'Friend request sent' });
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/accept', auth, async (req, res) => {
    try {
        const { requesterId } = req.body;
        const user = await User.findByPk(req.user.id);
        const requester = await User.findByPk(requesterId);
        if (!user || !requester) return res.status(404).json({ msg: 'User not found' });
        let userFriends = user.friends || [];
        if (!userFriends.includes(requesterId)) userFriends.push(requesterId);
        user.friends = userFriends;
        user.friendRequests = user.friendRequests.filter(id => id !== requesterId);
        await user.save();
        let reqFriends = requester.friends || [];
        if (!reqFriends.includes(user.id)) reqFriends.push(user.id);
        requester.friends = reqFriends;
        await requester.save();
        res.json({ msg: 'Friend accepted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const friends = await User.findAll({ where: { id: user.friends }, attributes: ['id', 'name', 'username', 'age', 'gender'] });
        const requests = await User.findAll({ where: { id: user.friendRequests }, attributes: ['id', 'name', 'username', 'age', 'gender'] });
        res.json({ friends, requests });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;