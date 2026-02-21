require('dotenv').config();
const express = require('express');
const db = require('./db/index');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Get all stops or filter by name/locality, limited to 50 results
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

// Create stop
app.post('/api/stops', async (req, res, next) => {
	try {
		const { atco_code, stop_name, street, indicator, latitude, longitude, locality } = req.body;

		if (!atco_code || !stop_name) {
		return res.status(400).json({ error: 'atco_code and stop_name are required' });
		}

		if (!latitude || !longitude) {
			return res.status(400).json({ error: 'latitude and longitude are required' });
		}

		const query = `
		INSERT INTO stops (atco_code, stop_name, street, indicator, latitude, longitude, locality)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (atco_code) DO UPDATE SET
			stop_name = EXCLUDED.stop_name,
			street = EXCLUDED.street,
			indicator = EXCLUDED.indicator,
			latitude = EXCLUDED.latitude,
			longitude = EXCLUDED.longitude,
			locality = EXCLUDED.locality
		RETURNING *;
		`;
		const { rows } = await db.query(query, [atco_code, stop_name, street, indicator, latitude, longitude, locality]);
		res.status(201).json(rows[0]);
	} catch (err) { next(err); }
});

// Delete stop
app.delete('/api/stops/:id', async (req, res, next) => {
	try {
		const { rows } = await db.query('DELETE FROM stops WHERE atco_code = $1 RETURNING *', [req.params.id]);
		if (!rows.length) return res.status(404).json({ error: 'Stop not found' });
		res.json(rows[0]);
	} catch (err) { next(err); }
});

// Update stop
app.put('/api/stops/:id', async (req, res, next) => {
	try {
		const { stop_name, street, indicator, latitude, longitude, locality } = req.body;
		const query = `
		UPDATE stops
		SET stop_name = COALESCE($2, stop_name),
			street = COALESCE($3, street),
			indicator = COALESCE($4, indicator),
			latitude = COALESCE($5, latitude),
			longitude = COALESCE($6, longitude),
			locality = COALESCE($7, locality)
		WHERE atco_code = $1
		RETURNING *;
		`;
		const { rows } = await db.query(query, [req.params.id, stop_name, street, indicator, latitude, longitude, locality]);
		if (!rows.length) return res.status(404).json({ error: 'Stop not found' });
		res.json(rows[0]);
	} catch (err) { next(err); }
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
