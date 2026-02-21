require('dotenv').config();
const express = require('express');
const db = require('./db/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Get all stops or filter by name/locality
app.get('/api/stops', async (req, res) => {
    const { name, locality } = req.query;
    try {
        let query = 'SELECT * FROM stops WHERE 1=1';
        const params = [];

        if (name) {
            params.push(`%${name}%`);
            query += ` AND stop_name ILIKE $${params.length}`;
        }
        if (locality) {
            params.push(locality);
            query += ` AND locality = $${params.length}`;
        }

        const result = await db.query(query + ' ORDER BY stop_name LIMIT 50', params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single stop
app.get('/api/stops/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM stops WHERE atco_code = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Stop not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
