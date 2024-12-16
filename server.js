require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_PATH = process.env.DB_PATH || 'users.db';
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error(err.message);
    else {
        console.log('Connected to SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT
            );
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                content TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        `);
    }
});

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = user;
        next();
    });
};

// REGISTER Endpoint
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) return res.status(400).json({ error: 'All fields are required.' });

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error hashing password.' });

        db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role],
            function (err) {
                if (err) return res.status(400).json({ error: 'Email already exists.' });
                res.status(201).json({ message: 'User registered successfully!' });
            });
    });
});

// LOGIN Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found.' });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) return res.status(403).json({ error: 'Invalid credentials.' });

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
            res.json({ message: 'Login successful!', token });
        });
    });
});

// POST FEEDBACK Endpoint
app.post('/feedback', authenticateToken, (req, res) => {
    const { content, user_id } = req.body;

    if (!content || !user_id) return res.status(400).json({ error: 'Content and user_id are required.' });

    db.run('INSERT INTO feedback (user_id, content) VALUES (?, ?)', [user_id, content], function (err) {
        if (err) return res.status(500).json({ error: 'Error saving feedback.' });
        res.json({ message: 'Feedback saved successfully!' });
    });
});

// GET FEEDBACK Endpoint (Medarbejder view)
app.get('/feedback', authenticateToken, (req, res) => {
    db.all('SELECT * FROM feedback WHERE user_id = ?', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching feedback.' });
        res.json({ feedback: rows });
    });
});

// UPDATE FEEDBACK Endpoint (Leder edit feedback)
app.put('/feedback/:id', authenticateToken, (req, res) => {
    const { content } = req.body;
    const feedbackId = req.params.id;

    db.run('UPDATE feedback SET content = ? WHERE id = ?', [content, feedbackId], function (err) {
        if (err) return res.status(500).json({ error: 'Error updating feedback.' });
        res.json({ message: 'Feedback updated successfully!' });
    });
});

// DELETE FEEDBACK Endpoint
app.delete('/feedback/:id', authenticateToken, (req, res) => {
    const feedbackId = req.params.id;

    db.run('DELETE FROM feedback WHERE id = ?', [feedbackId], function (err) {
        if (err) return res.status(500).json({ error: 'Error deleting feedback.' });
        res.json({ message: 'Feedback deleted successfully!' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
