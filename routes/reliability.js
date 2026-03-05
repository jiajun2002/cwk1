const express = require('express');
const router = express.Router();
const db = require('../db/index');

// Get reliability stats for a specific stop
router.get('/:atco_code', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_arrivals,
                ROUND((AVG(delay_minutes) FILTER (WHERE status != 'cancelled'))::numeric, 2) as avg_delay,
                COUNT(*) FILTER (WHERE status = 'early') as early_count,
                COUNT(*) FILTER (WHERE status = 'late') as late_count,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
                ROUND((COUNT(*) FILTER (WHERE status = 'on-time')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as punctuality_score
            FROM arrival_logs WHERE stop_id = $1
        `;
        const { rows } = await db.query(query, [req.params.atco_code]);
        if (!rows.length || rows[0].total_arrivals === "0") {
            return res.status(404).json({ error: 'Stop not found or no arrivals.' });
        }
        res.json({ atco_code: req.params.atco_code, stats: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get reliability stats for a specific route
router.get('/route/:route_number', async (req, res) => {
    try {
        const { stop_id } = req.query;
        let query = `
            SELECT 
                COUNT(*) as total_arrivals,
                ROUND((AVG(delay_minutes) FILTER (WHERE status != 'cancelled'))::numeric, 2) as avg_delay,
                COUNT(*) FILTER (WHERE status = 'early') as early_count,
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
        if (!rows.length || rows[0].total_arrivals === "0") {
            return res.status(404).json({ error: 'Route not found or no arrivals.' });
        }
        res.json({ route_number: req.params.route_number, ...(stop_id ? { stop_id } : {}), stats: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
