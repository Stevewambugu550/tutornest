// Roar East Africa API server (isolated from TutorNest tutoring routes)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = new Set([
    process.env.CLIENT_URL,
    process.env.ROAR_CLIENT_URL,
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
].filter(Boolean));

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        callback(new Error('Origin not allowed'));
    },
}));
app.use(express.json());
app.use((error, _req, res, next) => {
    if (error.message === 'Origin not allowed') return res.status(403).json({ message: 'Origin not allowed.' });
    next(error);
});

const roar = require('./roar');

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'roar-east-africa' }));
app.use('/api/roar', roar.router);

app.use((_req, res) => res.status(404).json({ message: 'Not found.' }));

const roarServer = app.listen(PORT, async () => {
    console.log(`🦁 Roar East Africa API running on http://localhost:${PORT}/api/roar`);
    await roar.init();
});

process.on('SIGTERM', () => roarServer.close());
