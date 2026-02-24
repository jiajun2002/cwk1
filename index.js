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

// Get all arrival logs, with optional filtering by stop_id and route_number
app.get('/api/logs', async (req, res) => {
		const { stop_id, route_number } = req.query;
		try {
				let query = 'SELECT * FROM arrival_logs WHERE 1=1';
				const params = [];
				if (stop_id) {
						params.push(stop_id);
						query += ` AND stop_id = $${params.length}`;
				}
				if (route_number) {
						params.push(route_number);
						query += ` AND route_number = $${params.length}`;
				}
				const result = await db.query(query + ' ORDER BY scheduled_time DESC LIMIT 50', params);
				res.json(result.rows);
		} catch (err) {
				res.status(500).json({ error: err.message });
		}
});

// Create a new arrival log
app.post('/api/logs', async (req, res) => {
    const { stop_id, route_number, scheduled_time, actual_time, delay_minutes, status } = req.body;
    try {
        const query = `
            INSERT INTO arrival_logs (stop_id, route_number, scheduled_time, actual_time, delay_minutes, status)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        const { rows } = await db.query(query, [stop_id, route_number, scheduled_time, actual_time, delay_minutes, status]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Edit an existing log entry
app.put('/api/logs/:id', async (req, res) => {
		const { stop_id, route_number, scheduled_time, actual_time, delay_minutes, status } = req.body;
		try {
				const query = `
						UPDATE arrival_logs
						SET stop_id = COALESCE($2, stop_id),
							route_number = COALESCE($3, route_number),
							scheduled_time = COALESCE($4, scheduled_time),
							actual_time = COALESCE($5, actual_time),
							delay_minutes = COALESCE($6, delay_minutes),
							status = COALESCE($7, status)
						WHERE id = $1
						RETURNING *
				`;
				const { rows } = await db.query(query, [req.params.id, stop_id, route_number, scheduled_time, actual_time, delay_minutes, status]);
				if (!rows.length) return res.status(404).json({ error: 'Log not found' });
				res.json(rows[0]);
		} catch (err) {
				res.status(400).json({ error: err.message });
		}
});

// Delete a specific log entry
app.delete('/api/logs/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM arrival_logs WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Log not found' });
        res.json({ message: 'Log deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get reliability stats for a specific stop
app.get('/api/reliability/:atco_code', async (req, res) => {
    try {
        const query = `
            SELECT 
							COUNT(*) as total_arrivals,
							ROUND((AVG(delay_minutes) FILTER (WHERE status != 'cancelled'))::numeric, 2) as avg_delay,
							COUNT(*) FILTER (WHERE status = 'late') as late_count,
							COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
							ROUND((COUNT(*) FILTER (WHERE status = 'on-time')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as punctuality_score
						FROM arrival_logs WHERE stop_id = $1
        `;
        const { rows } = await db.query(query, [req.params.atco_code]);
        res.json({ atco_code: req.params.atco_code, stats: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get reliability stats for a specific route (optionally scoped to a stop)
app.get('/api/reliability/route/:route_number', async (req, res) => {
	try {
		const { stop_id } = req.query;
		let query = `
			SELECT 
				COUNT(*) as total_arrivals,
				ROUND((AVG(delay_minutes) FILTER (WHERE status != 'cancelled'))::numeric, 2) as avg_delay,
				COUNT(*) FILTER (WHERE status = 'late') as late_count,
				COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
				ROUND((COUNT(*) FILTER (WHERE status = 'on-time')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as punctuality_score
			FROM arrival_logs
			WHERE route_number = $1
		`;
		const params = [req.params.route_number];
		if (stop_id) {
			params.push(stop_id);
			query += ` AND stop_id = $${params.length}`;
		}

		const { rows } = await db.query(query, params);
		res.json({ route_number: req.params.route_number, ...(stop_id ? { stop_id } : {}), stats: rows[0] });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
