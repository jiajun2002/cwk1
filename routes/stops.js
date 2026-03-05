const express = require('express');
const router = express.Router();
const db = require('../db/index');
const authenticateToken = require('../middleware/authenticateToken');

// Get all stops or filter by name/locality/atco_code, with pagination
router.get('/', async (req, res) => {
    const { name, locality, atco_code } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    try {
        let where = 'WHERE 1=1';
        const params = [];
        if (name) {
            params.push(`%${name}%`);
            where += ` AND stop_name ILIKE $${params.length}`;
        }
        if (locality) {
            params.push(`%${locality}%`);
            where += ` AND locality ILIKE $${params.length}`;
        }
        if (atco_code) {
            params.push(atco_code);
            where += ` AND atco_code = $${params.length}`;
        }
        const countResult = await db.query(`SELECT COUNT(*) FROM stops ${where}`, params);
        const total = parseInt(countResult.rows[0].count);
        params.push(limit, offset);
        const result = await db.query(
            `SELECT * FROM stops ${where} ORDER BY stop_name LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );
        res.json({ data: result.rows, page, limit, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Create stop (protected)
router.post('/', authenticateToken, async (req, res, next) => {
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

// Delete stop (protected)
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { rows } = await db.query('DELETE FROM stops WHERE atco_code = $1 RETURNING *', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Stop not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// Update stop (protected)
router.put('/:id', authenticateToken, async (req, res, next) => {
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

module.exports = router;
