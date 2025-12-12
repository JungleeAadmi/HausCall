const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        console.log("❌ Auth Failed: No token provided");
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error("❌ Auth Failed: Token invalid.", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};