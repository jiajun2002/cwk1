require('dotenv').config();
const express = require('express');
const db = require('./db/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
	try {
		const result = await db.query('SELECT NOW()');
		res.json({ message: 'Server is running!', dbTime: result.rows[0].now });
	} catch (err) {
		res.status(500).json({ error: 'Database connection failed', details: err.message });
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
