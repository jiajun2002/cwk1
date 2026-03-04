const express = require('express');
const router = express.Router();
const db = require('../db/index');
const authenticateToken = require('../middleware/authenticateToken');

// Get all arrival logs, with optional filtering by stop_id and route_number
router.get('/', async (req, res) => {
    const { stop_id, route_number } = req.query;
    try {
        // Check if stop_id exists
        if (stop_id) {
            const stopCheck = await db.query('SELECT 1 FROM stops WHERE atco_code = $1', [stop_id]);
            if (!stopCheck.rows.length) {
                return res.status(404).json({ error: 'Stop not found.' });
            }
        }
        // Check if route_number exists
        if (route_number) {
            const routeCheck = await db.query('SELECT 1 FROM arrival_logs WHERE route_number = $1 LIMIT 1', [route_number]);
            if (!routeCheck.rows.length) {
                return res.status(404).json({ error: 'Route not found.' });
            }
        }
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

// Create a new arrival log (protected)
router.post('/', authenticateToken, async (req, res) => {
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

// Edit an existing log entry (protected)
router.put('/:id', authenticateToken, async (req, res) => {
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

// Delete a specific log entry (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM arrival_logs WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Log not found' });
        res.json({ message: 'Log deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
