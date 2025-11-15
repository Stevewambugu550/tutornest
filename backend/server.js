// TutorNest Backend Server
// This is a starter template for your Node.js/Express backend

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose'); // For MongoDB
// const { Pool } = require('pg'); // For PostgreSQL
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Database Connection
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutornest', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// PostgreSQL Connection (Alternative)
// const pgPool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
// });

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tutors', require('./routes/tutors'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// WebSocket Server for Real-time Features
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true
    }
});

// WebSocket Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        // Verify JWT token here
        const user = await verifyToken(token);
        socket.userId = user.id;
        next();
    } catch (err) {
        next(new Error('Authentication failed'));
    }
});

// WebSocket Event Handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining session room
    socket.on('join_session', (sessionId) => {
        socket.join(`session:${sessionId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
        const { recipientId, message } = data;
        // Save message to database
        // Emit to recipient
        io.to(`user:${recipientId}`).emit('new_message', {
            senderId: socket.userId,
            message,
            timestamp: new Date()
        });
    });

    // Handle tutor status updates
    socket.on('update_status', (status) => {
        // Update tutor status in database
        // Broadcast to all clients
        io.emit('tutor_status_update', {
            tutorId: socket.userId,
            status,
            timestamp: new Date()
        });
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        socket.to(`user:${data.recipientId}`).emit('user_typing', {
            userId: socket.userId,
            isTyping: data.isTyping
        });
    });

    // Handle video call signaling
    socket.on('call_user', (data) => {
        io.to(`user:${data.recipientId}`).emit('incoming_call', {
            callerId: socket.userId,
            signal: data.signal
        });
    });

    socket.on('answer_call', (data) => {
        io.to(`user:${data.callerId}`).emit('call_answered', {
            signal: data.signal
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
        // Update user's online status
        io.emit('user_offline', { userId: socket.userId });
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`TutorNest API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Client URL: ${process.env.CLIENT_URL}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Helper function to verify JWT token
async function verifyToken(token) {
    // Implement JWT verification logic
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = app;
