const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authenticateToken;
