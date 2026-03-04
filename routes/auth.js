const express = require('express');
const router = express.Router();
const db = require('../db/index');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const { rows } = await db.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, password_hash]
        );
        res.status(201).json({ message: 'User registered successfully.', user: rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Username already exists.' });
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid username or password.' });
        const valid = await bcrypt.compare(password, rows[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid username or password.' });
        const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful.', token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
