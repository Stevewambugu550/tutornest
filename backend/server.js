// ============================================================
//  TutorNest Backend — JSON-file database (no MongoDB needed)
//  Serves static frontend AND API from one process on port 4000
// ============================================================

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');
const http    = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: process.env.CLIENT_URL || true } });
const PORT   = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'tutornest_jwt_secret_2024_change_in_prod';
const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:4000';
const allowedOrigins = new Set([
    FRONTEND_URL,
    process.env.ROAR_CLIENT_URL,
    'http://localhost:4173',
    'http://127.0.0.1:4173',
].filter(Boolean));

// ── Static frontend + middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.static(path.join(__dirname, '..')));
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

// ── JSON-file helpers ────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
    users:    path.join(DATA_DIR, 'users.json'),
    bookings: path.join(DATA_DIR, 'bookings.json'),
    tutors:   path.join(DATA_DIR, 'tutors.json'),
    subjects: path.join(DATA_DIR, 'subjects.json'),
    messages: path.join(DATA_DIR, 'messages.json'),
};

const store = require('./db');
const roar = require('./roar');

function readDB(key, fallback = []) {
    return store.read(key, fallback);
}

function writeDB(key, data) {
    store.write(key, data);
}

// Ensure messages.json exists
if (!fs.existsSync(FILES.messages)) {
    writeDB('messages', []);
}

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'No token provided' });
    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        return res.status(401).json({ message: 'Token invalid or expired. Please log in again.' });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        next();
    });
}

const activeTutors = new Map();
const studentQueue = [];
const whiteboardHistory = new Map();
const normalizeSubject = subject => String(subject || '').trim().toLowerCase();

// Resolve a user account to their tutor-profile id (bookings store profile ids like "1")
function resolveTutorProfileId(userId) {
    const user = readDB('users').find(u => u.id === userId);
    if (!user || user.role !== 'tutor') return null;
    const data   = readDB('tutors', { tutors: [] });
    const tutors = data.tutors || data;
    const profile = tutors.find(t => t.email?.toLowerCase() === user.email?.toLowerCase());
    return profile ? String(profile.id) : null;
}

// True if this user is a participant (or admin) on the given booking
function isBookingParticipant(booking, user) {
    if (!booking || !user) return false;
    if (user.role === 'admin') return true;
    if (booking.studentId === user.id || booking.tutorId === user.id) return true;
    const tutorPid = resolveTutorProfileId(user.id);
    return !!tutorPid && String(booking.tutorId) === tutorPid;
}

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        socket.user = jwt.verify(token, SECRET);
        next();
    } catch {
        next(new Error('Authentication required'));
    }
});

function matchInstantQueue() {
    for (let index = 0; index < studentQueue.length; index += 1) {
        const request = studentQueue[index];
        const match = [...activeTutors.entries()].find(([, tutor]) =>
            tutor.subjects.includes(request.subject)
        );
        if (!match) continue;

        const [tutorId, tutor] = match;
        const studentSocket = io.sockets.sockets.get(request.socketId);
        const tutorSocket = io.sockets.sockets.get(tutor.socketId);
        if (!studentSocket || !tutorSocket) {
            studentQueue.splice(index, 1);
            index -= 1;
            continue;
        }

        const users = readDB('users');
        const student = users.find(user => user.id === request.studentId);
        const tutorUser = users.find(user => user.id === tutorId);
        const booking = {
            id: 'bk_' + Date.now(),
            tutorId,
            studentId: request.studentId,
            tutorName: tutorUser ? `${tutorUser.firstName} ${tutorUser.lastName}` : 'Tutor',
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
            subject: request.displaySubject,
            notes: request.notes,
            dateTime: new Date().toISOString(),
            duration: 60,
            hourlyRate: 0,
            totalPrice: 0,
            status: 'confirmed',
            instant: true,
            createdAt: new Date().toISOString(),
        };
        const bookings = readDB('bookings');
        bookings.push(booking);
        writeDB('bookings', bookings);

        const roomId = `session_${booking.id}`;
        studentSocket.join(roomId);
        tutorSocket.join(roomId);
        const matchData = { roomId, sessionId: booking.id, subject: booking.subject };
        tutorSocket.emit('match_found', { ...matchData, participant: booking.studentName });
        studentSocket.emit('match_found', { ...matchData, participant: booking.tutorName });
        studentQueue.splice(index, 1);
        activeTutors.delete(tutorId);
        index -= 1;
    }

    studentQueue.forEach((request, index) => {
        io.to(request.socketId).emit('queue_status', { position: index + 1 });
    });
}

io.on('connection', socket => {
    socket.on('tutor_online', payload => {
        if (socket.user.role !== 'tutor') return socket.emit('matching_error', { message: 'Tutor account required.' });
        const subjects = [...new Set((payload?.subjects || []).map(normalizeSubject).filter(Boolean))].slice(0, 20);
        if (!subjects.length) return socket.emit('matching_error', { message: 'Add at least one teaching subject.' });
        activeTutors.set(socket.user.id, { socketId: socket.id, subjects });
        socket.emit('tutor_status', { online: true, subjects });
        matchInstantQueue();
    });

    socket.on('tutor_offline', () => {
        activeTutors.delete(socket.user.id);
        socket.emit('tutor_status', { online: false });
    });

    socket.on('request_instant_tutor', payload => {
        if (!['student', 'parent'].includes(socket.user.role)) {
            return socket.emit('matching_error', { message: 'Student or parent account required.' });
        }
        const displaySubject = String(payload?.subject || '').trim();
        const subject = normalizeSubject(displaySubject);
        const notes = String(payload?.notes || '').trim().slice(0, 500);
        if (!subject) return socket.emit('matching_error', { message: 'Choose a subject first.' });
        const existing = studentQueue.find(request => request.studentId === socket.user.id);
        if (existing) {
            existing.subject = subject;
            existing.displaySubject = displaySubject;
            existing.notes = notes;
            existing.socketId = socket.id;
        } else {
            studentQueue.push({ studentId: socket.user.id, subject, displaySubject, notes, socketId: socket.id });
        }
        matchInstantQueue();
    });

    socket.on('cancel_instant_request', () => {
        const index = studentQueue.findIndex(request => request.studentId === socket.user.id);
        if (index >= 0) studentQueue.splice(index, 1);
        socket.emit('queue_cancelled');
        matchInstantQueue();
    });

    socket.on('join_classroom', payload => {
        const sessionId = String(payload?.sessionId || '');
        const booking = readDB('bookings').find(item => item.id === sessionId);
        const authorized = isBookingParticipant(booking, socket.user);
        if (!authorized) return socket.emit('classroom_error', { message: 'You do not have access to this classroom.' });
        const roomId = `classroom_${sessionId}`;
        socket.join(roomId);
        socket.data.classroomId = roomId;
        socket.data.sessionId = sessionId;
        socket.emit('whiteboard_history', whiteboardHistory.get(sessionId) || []);
    });

    socket.on('draw_stroke', payload => {
        if (!socket.data.classroomId || payload?.sessionId !== socket.data.sessionId) return;
        const x = Number(payload.x);
        const y = Number(payload.y);
        const width = Math.min(20, Math.max(1, Number(payload.width) || 3));
        const type = ['start', 'draw', 'end'].includes(payload.type) ? payload.type : null;
        const color = /^#[0-9a-f]{6}$/i.test(payload.color) ? payload.color : '#2563eb';
        if (!type || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return;
        const stroke = { x, y, width, type, color };
        const history = whiteboardHistory.get(socket.data.sessionId) || [];
        history.push(stroke);
        if (history.length > 10000) history.splice(0, history.length - 10000);
        whiteboardHistory.set(socket.data.sessionId, history);
        socket.to(socket.data.classroomId).emit('draw_stroke', stroke);
    });

    socket.on('clear_whiteboard', payload => {
        if (!socket.data.classroomId || payload?.sessionId !== socket.data.sessionId) return;
        whiteboardHistory.delete(socket.data.sessionId);
        io.to(socket.data.classroomId).emit('whiteboard_cleared');
    });

    socket.on('chat_send', payload => {
        if (!socket.data.classroomId || payload?.sessionId !== socket.data.sessionId) return;
        const text = String(payload?.text || '').trim().slice(0, 2000);
        if (!text) return;
        const booking = readDB('bookings').find(b => b.id === socket.data.sessionId);
        if (!booking) return;

        const users     = readDB('users');
        const tutorData = readDB('tutors', { tutors: [] });
        const tutors    = tutorData.tutors || tutorData;
        const sender    = users.find(u => u.id === socket.user.id);
        const receiverId = socket.user.id === booking.studentId ? booking.tutorId : booking.studentId;
        const receiver  = users.find(u => u.id === receiverId) ||
                          tutors.find(t => String(t.id) === String(receiverId));

        const msg = {
            id:           'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            senderId:     socket.user.id,
            senderName:   sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'User',
            senderAvatar: sender ? sender.avatar : '',
            receiverId,
            receiverName: receiver ? ((receiver.firstName || receiver.name || '') + ' ' + (receiver.lastName || '')).trim() : 'User',
            text,
            read:      false,
            createdAt: new Date().toISOString(),
        };
        const messages = readDB('messages');
        messages.push(msg);
        writeDB('messages', messages);
        io.to(socket.data.classroomId).emit('chat_message', msg);
    });

    socket.on('chat_typing', payload => {
        if (!socket.data.classroomId || payload?.sessionId !== socket.data.sessionId) return;
        socket.to(socket.data.classroomId).emit('chat_typing', { userId: socket.user.id, typing: !!payload.typing });
    });

    socket.on('chat_read', payload => {
        if (!socket.data.classroomId || payload?.sessionId !== socket.data.sessionId) return;
        const booking = readDB('bookings').find(b => b.id === socket.data.sessionId);
        if (!booking) return;
        const otherId  = socket.user.id === booking.studentId ? booking.tutorId : booking.studentId;
        const myIds    = new Set([socket.user.id, resolveTutorProfileId(socket.user.id)].filter(Boolean).map(String));
        const messages = readDB('messages');
        let changed = false;
        messages.forEach(m => {
            if (!m.read && myIds.has(String(m.receiverId)) && String(m.senderId) === String(otherId)) {
                m.read = true;
                changed = true;
            }
        });
        if (changed) writeDB('messages', messages);
        socket.to(socket.data.classroomId).emit('chat_read', { userId: socket.user.id });
    });

    socket.on('disconnect', () => {
        const tutor = activeTutors.get(socket.user.id);
        if (tutor?.socketId === socket.id) activeTutors.delete(socket.user.id);
        for (let index = studentQueue.length - 1; index >= 0; index -= 1) {
            if (studentQueue[index].socketId === socket.id) studentQueue.splice(index, 1);
        }
        matchInstantQueue();
    });
});

// ── Auto-create default admin on startup ────────────────────────────────────
function ensureDefaultAdmin() {
    const users = readDB('users');
    const adminEmail = 'admin@tutornest.com';
    const matchingIndexes = users
        .map((user, index) => user.email?.toLowerCase() === adminEmail ? index : -1)
        .filter(index => index >= 0);

    if (matchingIndexes.length) {
        const adminIndex = matchingIndexes.find(index => users[index].role === 'admin') ?? matchingIndexes[0];
        users[adminIndex].role = 'admin';
        const normalizedUsers = users.filter((_, index) => !matchingIndexes.includes(index) || index === adminIndex);
        writeDB('users', normalizedUsers);
        return;
    }

    if (!users.find(u => u.role === 'admin')) {
        const hashedPw = bcrypt.hashSync('Admin@TutorNest2024', 10);
        const admin = {
            id:        'admin_001',
            email:     adminEmail,
            password:  hashedPw,
            firstName: 'Site',
            lastName:  'Admin',
            role:      'admin',
            avatar:    'https://ui-avatars.com/api/?name=Admin&background=5b50e8&color=fff&size=200',
            createdAt: new Date().toISOString(),
        };
        users.push(admin);
        writeDB('users', users);
        console.log('\n🔐 Default admin created:');
        console.log('   Email:    admin@tutornest.com');
        console.log('   Password: Admin@TutorNest2024\n');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════

async function handleRegister(req, res) {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const allowedRoles = ['student', 'parent', 'tutor'];
        const safeRole = allowedRoles.includes(role) ? role : 'student';
        const users = readDB('users');
        if (users.find(u => u.email?.toLowerCase() === normalizedEmail)) {
            return res.status(400).json({ message: 'An account with that email already exists.' });
        }
        const hashedPw = await bcrypt.hash(password, 10);
        const newUser = {
            id:        'usr_' + Date.now(),
            email:     normalizedEmail,
            password:  hashedPw,
            firstName,
            lastName,
            role:      safeRole,
            avatar:    `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + '+' + lastName)}&background=667eea&color=fff`,
            createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        writeDB('users', users);
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET, { expiresIn: '7d' });
        const { password: _pw, ...safeUser } = newUser;
        res.status(201).json({ token, user: safeUser });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function handleLogin(req, res) {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const users = readDB('users');
        const user  = users.find(u => u.email?.toLowerCase() === normalizedEmail);
        if (!user) return res.status(400).json({ message: 'Invalid email or password.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid email or password.' });
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
        const { password: _pw, ...safeUser } = user;
        res.json({ token, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

app.post('/api/register',      handleRegister);
app.post('/api/auth/register', handleRegister);
app.post('/api/login',         handleLogin);
app.post('/api/auth/login',    handleLogin);

app.get('/api/auth/me', requireAuth, (req, res) => {
    const users = readDB('users');
    const user  = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const users = readDB('users');
        const user  = users.find(u => u.email === email);
        if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });
        const resetToken = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });
        const resetUrl   = `${FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        console.log('\n── PASSWORD RESET ──\n' + resetUrl + '\n───────────────────\n');
        res.json({ message: 'If that email exists, a reset link has been sent.', resetUrl });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ message: 'Missing token or password.' });
        const decoded = jwt.verify(token, SECRET);
        const users   = readDB('users');
        const idx     = users.findIndex(u => u.id === decoded.id);
        if (idx < 0) return res.status(400).json({ message: 'Invalid token.' });
        users[idx].password = await bcrypt.hash(password, 10);
        writeDB('users', users);
        res.json({ message: 'Password reset successfully.' });
    } catch { res.status(400).json({ message: 'Token is invalid or has expired.' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
//  TUTOR ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/tutors', (req, res) => {
    const data    = readDB('tutors', { tutors: [] });
    const users   = readDB('users');
    const activeEmails = new Set(users
        .filter(user => activeTutors.has(user.id))
        .map(user => user.email?.toLowerCase()));
    let tutors    = (data.tutors || data).map(tutor => ({
        ...tutor,
        isOnline: activeEmails.has(tutor.email?.toLowerCase()),
    }));
    const { subject, q, minRate, maxRate, minRating } = req.query;
    if (subject) tutors = tutors.filter(t =>
        (t.expertise||[]).some(e => e.toLowerCase().includes(subject.toLowerCase())));
    if (q) tutors = tutors.filter(t =>
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        (t.bio||'').toLowerCase().includes(q.toLowerCase()) ||
        (t.expertise||[]).some(e => e.toLowerCase().includes(q.toLowerCase())));
    if (minRate)    tutors = tutors.filter(t => t.hourlyRate >= Number(minRate));
    if (maxRate)    tutors = tutors.filter(t => t.hourlyRate <= Number(maxRate));
    if (minRating)  tutors = tutors.filter(t => t.rating >= Number(minRating));
    res.json(tutors);
});

app.get('/api/tutors/search', (req, res) => {
    const data   = readDB('tutors', { tutors: [] });
    let tutors   = data.tutors || data;
    const { q }  = req.query;
    if (q) tutors = tutors.filter(t =>
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        (t.expertise||[]).some(e => e.toLowerCase().includes(q.toLowerCase())));
    res.json({ success: true, tutors });
});

app.get('/api/tutors/:id', (req, res) => {
    const data   = readDB('tutors', { tutors: [] });
    const tutors = data.tutors || data;
    const tutor  = tutors.find(t => String(t.id) === req.params.id);
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    res.json(tutor);
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUBJECTS
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/subjects', (req, res) => {
    res.json(readDB('subjects', []));
});

// ═══════════════════════════════════════════════════════════════════════════
//  BOOKING / SESSION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

function handleBookSession(req, res) {
    try {
        const resolvedStudentId = req.user.id;

        const { tutorId, dateTime, subject, duration, hourlyRate, notes } = req.body;
        if (!tutorId) return res.status(400).json({ message: 'tutorId is required' });

        const bookings  = readDB('bookings');
        const tutorData = readDB('tutors', { tutors: [] });
        const tutors    = tutorData.tutors || tutorData;
        const tutor     = tutors.find(t => String(t.id) === String(tutorId));
        const users     = readDB('users');
        const student   = users.find(u => u.id === resolvedStudentId);

        const rate  = hourlyRate || (tutor ? tutor.hourlyRate : 0);
        const mins  = duration || 60;
        const total = Math.round((rate * mins) / 60);

        const booking = {
            id:          'bk_' + Date.now(),
            tutorId:     String(tutorId),
            studentId:   resolvedStudentId,
            tutorName:   tutor   ? tutor.name   : 'Unknown Tutor',
            studentName: student ? (student.firstName + ' ' + student.lastName) : 'Guest',
            subject:     subject || 'General',
            notes:       String(notes || '').trim().slice(0, 500),
            dateTime:    dateTime || new Date().toISOString(),
            duration:    mins,
            hourlyRate:  rate,
            totalPrice:  total,
            status:      'confirmed',
            createdAt:   new Date().toISOString(),
        };
        bookings.push(booking);
        writeDB('bookings', bookings);
        console.log(`Booking ${booking.id}: ${booking.studentName} ↔ ${booking.tutorName}`);
        res.json({ success: true, message: 'Session booked!', booking });
    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

app.post('/api/book-session',  requireAuth, handleBookSession);
app.post('/api/sessions/book', requireAuth, handleBookSession);

app.get('/api/my-bookings', requireAuth, (req, res) => {
    const bookings = readDB('bookings');
    const mine     = bookings.filter(b => isBookingParticipant(b, req.user));
    // Sort newest first
    mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(mine);
});

app.get('/api/bookings', requireAuth, (req, res) => {
    const bookings = readDB('bookings');
    res.json(bookings);
});

app.put('/api/bookings/:id/cancel', requireAuth, (req, res) => {
    const bookings = readDB('bookings');
    const idx      = bookings.findIndex(b => b.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: 'Booking not found' });
    // Only allow a participant (student/tutor) or admin to cancel
    if (!isBookingParticipant(bookings[idx], req.user)) {
        return res.status(403).json({ message: 'Not authorised to cancel this booking' });
    }
    bookings[idx].status = 'cancelled';
    writeDB('bookings', bookings);
    res.json({ success: true, booking: bookings[idx] });
});

// GET /api/sessions/:id — get a single booking/session (for session room)
app.get('/api/sessions/:id', requireAuth, (req, res) => {
    const bookings = readDB('bookings');
    const booking  = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ message: 'Session not found' });
    // Only participants or admin can view
    if (!isBookingParticipant(booking, req.user)) {
        return res.status(403).json({ message: 'Access denied' });
    }
    res.json(booking);
});

// ═══════════════════════════════════════════════════════════════════════════
//  MESSAGES (real chat between users)
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/messages/conversations — list all unique conversations for current user
app.get('/api/messages/conversations', requireAuth, (req, res) => {
    const messages = readDB('messages');
    const userId   = req.user.id;
    const users    = readDB('users');
    const tutorData = readDB('tutors', { tutors: [] });
    const tutors    = tutorData.tutors || tutorData;

    // Find all unique other-user IDs that this user has talked with
    const convMap = {};
    messages.forEach(m => {
        if (m.senderId === userId || m.receiverId === userId) {
            const otherId = m.senderId === userId ? m.receiverId : m.senderId;
            if (!convMap[otherId] || new Date(m.createdAt) > new Date(convMap[otherId].lastAt)) {
                convMap[otherId] = { otherId, lastMsg: m.text, lastAt: m.createdAt, unread: 0 };
            }
            if (m.receiverId === userId && !m.read) convMap[otherId].unread++;
        }
    });

    // Get bookings to seed conversations
    const bookings = readDB('bookings');
    const tutorPid = resolveTutorProfileId(userId);
    bookings.forEach(b => {
        let otherId = null;
        if (b.studentId === userId) otherId = b.tutorId;
        if (tutorPid && String(b.tutorId) === tutorPid) otherId = b.studentId;
        // Note: tutor bookingId is a number string like "1","2" not usr_ prefix
        if (!convMap[otherId] && otherId) {
            convMap[otherId] = { otherId, lastMsg: 'Session booked: ' + b.subject, lastAt: b.createdAt, unread: 0, fromBooking: true };
        }
    });

    // Enrich with user info
    const conversations = Object.values(convMap).map(c => {
        // Try users first, then tutors
        const u = users.find(u => u.id === c.otherId);
        if (u) {
            const { password, ...safe } = u;
            return { ...c, other: safe };
        }
        const t = tutors.find(t => String(t.id) === String(c.otherId));
        if (t) return { ...c, other: { id: t.id, firstName: t.name, lastName: '', role: 'tutor', avatar: t.avatar, education: t.education } };
        return { ...c, other: { id: c.otherId, firstName: 'Unknown', lastName: '', role: 'unknown' } };
    });

    conversations.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    res.json(conversations);
});

// GET /api/messages/:otherId — get messages between current user and otherId
app.get('/api/messages/:otherId', requireAuth, (req, res) => {
    const messages = readDB('messages');
    const userId   = req.user.id;
    const otherId  = req.params.otherId;
    const thread   = messages.filter(m =>
        (m.senderId === userId && m.receiverId === otherId) ||
        (m.senderId === otherId && m.receiverId === userId)
    );
    thread.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(thread);
});

// POST /api/messages — send a message
app.post('/api/messages', requireAuth, (req, res) => {
    try {
        const { receiverId, text } = req.body;
        if (!receiverId || !text || !text.trim()) {
            return res.status(400).json({ message: 'receiverId and text are required' });
        }
        const messages = readDB('messages');
        const users    = readDB('users');
        const tutorData = readDB('tutors', { tutors: [] });
        const tutors    = tutorData.tutors || tutorData;

        const sender   = users.find(u => u.id === req.user.id);
        const receiver = users.find(u => u.id === receiverId) || tutors.find(t => String(t.id) === String(receiverId));

        const msg = {
            id:         'msg_' + Date.now(),
            senderId:   req.user.id,
            senderName: sender ? (sender.firstName + ' ' + sender.lastName) : 'User',
            senderAvatar: sender ? sender.avatar : '',
            receiverId,
            receiverName: receiver ? (receiver.firstName || receiver.name) + ' ' + (receiver.lastName || '') : 'User',
            text:       text.trim(),
            read:       false,
            createdAt:  new Date().toISOString(),
        };
        messages.push(msg);
        writeDB('messages', messages);
        res.status(201).json(msg);
    } catch (err) {
        console.error('Message error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/messages/:otherId/read — mark all messages from otherId as read
app.put('/api/messages/:otherId/read', requireAuth, (req, res) => {
    const messages = readDB('messages');
    const userId   = req.user.id;
    const otherId  = req.params.otherId;
    let updated = 0;
    messages.forEach(m => {
        if (m.senderId === otherId && m.receiverId === userId && !m.read) {
            m.read = true;
            updated++;
        }
    });
    writeDB('messages', messages);
    res.json({ updated });
});

// ═══════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/notifications', requireAuth, (req, res) => {
    const bookings = readDB('bookings');
    const messages = readDB('messages');
    const userId   = req.user.id;

    const tutorPid = resolveTutorProfileId(userId);
    const upcoming = bookings.filter(b =>
        (b.studentId === userId || b.tutorId === userId || (tutorPid && String(b.tutorId) === tutorPid)) &&
        b.status === 'confirmed' &&
        new Date(b.dateTime) > new Date()
    ).slice(0, 3).map(b => ({
        id:   'notif_bk_' + b.id,
        type: 'session',
        text: `Upcoming session with ${b.studentId === userId ? b.tutorName : b.studentName} — ${b.subject}`,
        time: b.dateTime,
    }));

    const unread = messages.filter(m => m.receiverId === userId && !m.read).length;
    const notes  = [...upcoming];
    if (unread > 0) notes.unshift({ id: 'notif_msg', type: 'message', text: `You have ${unread} unread message${unread>1?'s':''}`, time: new Date().toISOString() });
    res.json(notes);
});

// ═══════════════════════════════════════════════════════════════════════════
//  PLATFORM STATS
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/stats', (req, res) => {
    const tutorData = readDB('tutors', { tutors: [] });
    const tutors    = tutorData.tutors || tutorData;
    const users     = readDB('users');
    const bookings  = readDB('bookings');
    const revenue   = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    res.json({
        tutors:   tutors.length,
        students: users.filter(u => u.role === 'student').length,
        sessions: bookings.length,
        subjects: 300,
        revenue,
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const tutorData = readDB('tutors', { tutors: [] });
    const tutors    = tutorData.tutors || tutorData;
    const users     = readDB('users');
    const bookings  = readDB('bookings');
    const messages  = readDB('messages');

    const revenue     = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    const confirmed   = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled   = bookings.filter(b => b.status === 'cancelled').length;
    const thisMonth   = bookings.filter(b => {
        const d = new Date(b.createdAt);
        const n = new Date();
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;

    res.json({
        totalUsers:    users.length,
        totalStudents: users.filter(u => u.role === 'student').length,
        totalTutors:   tutors.length,
        totalBookings: bookings.length,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled,
        bookingsThisMonth: thisMonth,
        totalRevenue:  revenue,
        totalMessages: messages.length,
        subjects:      300,
    });
});

// GET /api/admin/users
app.get('/api/admin/users', requireAdmin, (req, res) => {
    const users = readDB('users').map(({ password, ...u }) => u);
    res.json(users);
});

// PUT /api/admin/users/:id — update role, name etc.
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const users = readDB('users');
    const idx   = users.findIndex(u => u.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: 'User not found' });
    const allowed = ['role', 'firstName', 'lastName', 'avatar'];
    allowed.forEach(k => { if (req.body[k] !== undefined) users[idx][k] = req.body[k]; });
    writeDB('users', users);
    const { password, ...safe } = users[idx];
    res.json({ success: true, user: safe });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    if (req.params.id === 'admin_001') {
        return res.status(400).json({ message: 'Cannot delete the default admin account.' });
    }
    let users = readDB('users');
    const exists = users.find(u => u.id === req.params.id);
    if (!exists) return res.status(404).json({ message: 'User not found' });
    users = users.filter(u => u.id !== req.params.id);
    writeDB('users', users);
    res.json({ success: true });
});

// GET /api/admin/bookings
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
    const bookings = readDB('bookings');
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bookings);
});

// PUT /api/admin/bookings/:id — update status
app.put('/api/admin/bookings/:id', requireAdmin, (req, res) => {
    const bookings = readDB('bookings');
    const idx      = bookings.findIndex(b => b.id === req.params.id);
    if (idx < 0) return res.status(404).json({ message: 'Booking not found' });
    if (req.body.status) bookings[idx].status = req.body.status;
    writeDB('bookings', bookings);
    res.json({ success: true, booking: bookings[idx] });
});

// DELETE /api/admin/bookings/:id
app.delete('/api/admin/bookings/:id', requireAdmin, (req, res) => {
    let bookings = readDB('bookings');
    if (!bookings.find(b => b.id === req.params.id)) return res.status(404).json({ message: 'Booking not found' });
    bookings = bookings.filter(b => b.id !== req.params.id);
    writeDB('bookings', bookings);
    res.json({ success: true });
});

// GET /api/admin/tutors
app.get('/api/admin/tutors', requireAdmin, (req, res) => {
    const data   = readDB('tutors', { tutors: [] });
    const tutors = data.tutors || data;
    res.json(tutors);
});

// PUT /api/admin/tutors/:id
app.put('/api/admin/tutors/:id', requireAdmin, (req, res) => {
    const data   = readDB('tutors', { tutors: [] });
    let tutors   = data.tutors || data;
    const idx    = tutors.findIndex(t => String(t.id) === req.params.id);
    if (idx < 0) return res.status(404).json({ message: 'Tutor not found' });
    const allowed = ['name','bio','expertise','hourlyRate','isOnline','rating','education','experience'];
    allowed.forEach(k => { if (req.body[k] !== undefined) tutors[idx][k] = req.body[k]; });
    writeDB('tutors', Array.isArray(data) ? tutors : { ...data, tutors });
    res.json({ success: true, tutor: tutors[idx] });
});

// ═══════════════════════════════════════════════════════════════════════════
//  AI ASSISTANT (free — local FAQ + Pollinations fallback, no API key)
// ═══════════════════════════════════════════════════════════════════════════

const AI_FAQ = [
    { keys: ['book', 'booking', 'schedule', 'session'], a: 'To book a session: go to Find Tutors, pick a tutor, and click "Book Session". You\'ll get a Join button on your dashboard when it\'s time.' },
    { keys: ['price', 'cost', 'rate', 'pay', 'fee', 'much'], a: 'Each tutor sets an hourly rate shown on their profile. The total price = rate × session length, calculated automatically when you book.' },
    { keys: ['instant', 'now', 'urgent', 'quick', 'match'], a: 'Use Instant Classes: choose a subject and you\'ll be matched in real time with an online tutor — no scheduling needed.' },
    { keys: ['cancel', 'refund', 'reschedule'], a: 'You can cancel a booking from your dashboard under Sessions. Cancelled sessions show a "cancelled" status immediately.' },
    { keys: ['tutor', 'become', 'teach', 'apply'], a: 'To teach on TutorNest, sign up with the Tutor role, then go online from your tutor dashboard to receive instant student matches.' },
    { keys: ['video', 'camera', 'zoom', 'call', 'classroom'], a: 'Sessions happen in the built-in classroom: live video, a shared whiteboard, chat, and notes. Just click Join on your booking.' },
    { keys: ['whiteboard', 'draw', 'board'], a: 'In the classroom, click the Whiteboard button to open a shared canvas — both you and your tutor see drawings in real time.' },
    { keys: ['password', 'reset', 'forgot', 'login'], a: 'Use "Forgot password?" on the login page to get a reset link. If you can\'t log in, check your email spelling and password.' },
    { keys: ['parent', 'child', 'monitor'], a: 'Parent accounts see their child\'s bookings, tutors, and progress on the parent dashboard.' },
    { keys: ['subject', 'math', 'science', 'language', 'learn'], a: 'TutorNest covers 300+ subjects across 14 categories — Math, Sciences, Languages, Test Prep, Arts, and more. Browse them under Find Tutors or Subjects.' },
];

const AI_FALLBACK = "I'm not sure about that one — try asking about booking sessions, instant classes, pricing, the classroom, or a quick math question like \"what is 12 × 8\".";

// Safe arithmetic evaluator for quick math questions (digits/operators only)
function tryMathAnswer(q) {
    const expr = q.replace(/what is|what's|solve|calculate|equals|=|\?|x/ig, match => match.toLowerCase() === 'x' ? '*' : '')
                  .replace(/×/g, '*').replace(/÷/g, '/').trim();
    if (!/^[\d\s+\-*/().^%]+$/.test(expr) || !/\d/.test(expr)) return null;
    try {
        const val = Function('"use strict"; return (' + expr.replace(/\^/g, '**') + ')')();
        if (typeof val === 'number' && Number.isFinite(val)) {
            return `${expr.trim()} = ${Math.round(val * 10000) / 10000}`;
        }
    } catch {}
    return null;
}

function localAiAnswer(q) {
    const math = tryMathAnswer(q);
    if (math) return math;
    const text = q.toLowerCase();
    let best = null, bestScore = 0;
    for (const f of AI_FAQ) {
        const score = f.keys.filter(k => text.includes(k)).length;
        if (score > bestScore) { best = f; bestScore = score; }
    }
    return bestScore > 0 ? best.a : null;
}

app.post('/api/ai/ask', async (req, res) => {
    const question = String(req.body?.question || '').trim().slice(0, 500);
    if (!question) return res.status(400).json({ message: 'question is required' });

    const local = localAiAnswer(question);
    if (local) return res.json({ answer: local, source: 'tutornest' });

    try {
        const prompt = `You are the TutorNest assistant, a friendly helper inside an online tutoring platform. Answer briefly (2-3 sentences max). Question: ${question}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const r = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), { signal: controller.signal });
        clearTimeout(timer);
        if (!r.ok) throw new Error('upstream ' + r.status);
        const answer = (await r.text()).trim().slice(0, 800);
        // Free upstreams sometimes return error/credit notices as 200 text — filter them
        if (/credits|top up|api key|error|rate limit/i.test(answer)) throw new Error('bad upstream response');
        res.json({ answer, source: 'ai' });
    } catch (err) {
        res.json({ answer: AI_FALLBACK, source: 'fallback' });
    }
});

app.use('/api/roar', roar.router);

// ═══════════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0' });
});

app.get('/classroom/:sessionId', (req, res) => {
    if (!/^bk_[A-Za-z0-9_-]+$/.test(req.params.sessionId)) {
        return res.status(400).send('Invalid classroom ID');
    }
    res.sendFile(path.join(__dirname, '..', 'session.html'));
});

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    const reqPath = req.path.endsWith('.html') ? req.path : '/index.html';
    const file    = path.join(__dirname, '..', reqPath);
    if (fs.existsSync(file)) res.sendFile(file);
    else res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
Promise.all([store.init(FILES), roar.init()]).then(() => {
    ensureDefaultAdmin();
    server.listen(PORT, () => {
        console.log(`\n🚀 TutorNest running on http://localhost:${PORT}`);
        console.log('   Frontend + API + instant matching served from one process.');
        console.log(`   Storage: ${store.isReady() ? 'PostgreSQL (Supabase)' : 'JSON file storage'}\n`);
    });
});
