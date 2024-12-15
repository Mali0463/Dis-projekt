const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const authenticateToken = require('./public/js/middleware');
const app = express();
const util = require('util');

const port = 5000;
const secretKey = process.env.SECRET_KEY || 'default_secret';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
let db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('Connected to SQLite database.');
});

const dbGet = util.promisify(db.get).bind(db);
const dbAll = util.promisify(db.all).bind(db);
const dbRun = util.promisify(db.run).bind(db);

// Initialize tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'medarbejder'
)`);

// Feedback table
db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    feedback TEXT NOT NULL,
    FOREIGN KEY (recipient_email) REFERENCES users (email)
)`);

// Registration endpoint
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, [email, hashedPassword, role || 'medarbejder']);
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Email already exists or server error' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ email: user.email, role: user.role }, secretKey, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.json({ redirectUrl: user.role === 'leder' ? '/leder.html' : '/main.html' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware protected route
app.get('/current-user', authenticateToken, (req, res) => {
    res.json(req.user);
});

// Get all employees for leader
app.get('/employees', authenticateToken, async (req, res) => {
    if (req.user.role !== 'leder') return res.status(403).json({ error: 'Access Denied' });
    try {
        const employees = await dbAll(`SELECT email FROM users WHERE role = 'medarbejder'`);
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Add feedback
app.post('/feedback', authenticateToken, async (req, res) => {
    const { recipient_email, feedback } = req.body;
    if (!recipient_email || !feedback) return res.status(400).json({ error: 'Invalid input' });
    try {
        await dbRun(`INSERT INTO feedback (recipient_email, feedback) VALUES (?, ?)`, [recipient_email, feedback]);
        res.json({ message: 'Feedback added successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add feedback' });
    }
});

// Fetch feedback for user
app.get('/feedback/user', authenticateToken, async (req, res) => {
    try {
        const feedbacks = await dbAll(`SELECT id, feedback FROM feedback WHERE recipient_email = ?`, [req.user.email]);
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// Delete feedback
app.delete('/feedback/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await dbRun(`DELETE FROM feedback WHERE id = ?`, [id]);
        res.json({ message: 'Feedback deleted!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete feedback' });
    }
});

// Server listening
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
