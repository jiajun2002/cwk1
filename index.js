
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Import modularized routes
const authRoutes = require('./routes/auth');
const stopsRoutes = require('./routes/stops');
const logsRoutes = require('./routes/logs');
const reliabilityRoutes = require('./routes/reliability');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/stops', stopsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/reliability', reliabilityRoutes);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
