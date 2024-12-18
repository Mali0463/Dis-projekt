const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = 'EnLangHemmeligNoegle123XYZ!'; // Hardkodet secret
const DB_PATH = 'users.db';
const TOKEN_EXPIRATION = '1h';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));

const db = new sqlite3.Database('/var/www/app/database/users.db', (err) => {
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


const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = user;
        next();
    });
};

app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'All fields are required.' });

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error hashing password.' });

        db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role],
            function (err) {
                if (err) {
                    console.error("Fejl ved indsættelse af bruger:", err);
                    return res.status(400).json({ error: 'Email already exists.' });
                }
                res.status(201).json({ message: 'User registered successfully!' });
            });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error("Databasefejl ved login:", err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
        if (!user) return res.status(400).json({ error: 'User not found.' });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) return res.status(403).json({ error: 'Invalid credentials.' });

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
            res.json({ message: 'Login successful!', token, role: user.role });
        });
    });
});

app.post('/feedback', authenticateToken, (req, res) => {
    const { recipient_email, content } = req.body;
    if (!content || !recipient_email) return res.status(400).json({ error: 'Content and recipient_email are required.' });
    if (req.user.role !== 'leder') return res.status(403).json({ error: 'Only leaders can give feedback.' });

    db.get('SELECT id FROM users WHERE email = ?', [recipient_email], (err, userRow) => {
        if (err) return res.status(500).json({ error: 'Error fetching user_id.' });
        if (!userRow) return res.status(400).json({ error: 'No user found with that email.' });

        const user_id = userRow.id;
        db.run('INSERT INTO feedback (user_id, content) VALUES (?, ?)', [user_id, content], function (err) {
            if (err) return res.status(500).json({ error: 'Error saving feedback.' });
            res.json({ message: 'Feedback saved successfully!' });
        });
    });
});

app.get('/feedback', authenticateToken, (req, res) => {
    if (req.user.role === 'leder') {
        db.all(`
            SELECT feedback.id, feedback.content, users.email AS recipient_email
            FROM feedback
            JOIN users ON feedback.user_id = users.id
        `, [], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error fetching feedback.' });
            res.json({ feedback: rows });
        });
    } else {
        db.all('SELECT id, content FROM feedback WHERE user_id = ?', [req.user.id], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error fetching feedback.' });
            res.json({ feedback: rows });
        });
    }
});

app.put('/feedback/:id', authenticateToken, (req, res) => {
    const { content } = req.body;
    const feedbackId = req.params.id;

    if (req.user.role !== 'leder') return res.status(403).json({ error: 'Only leaders can edit feedback.' });

    db.run('UPDATE feedback SET content = ? WHERE id = ?', [content, feedbackId], function (err) {
        if (err) return res.status(500).json({ error: 'Error updating feedback.' });
        res.json({ message: 'Feedback updated successfully!' });
    });
});

app.delete('/feedback/:id', authenticateToken, (req, res) => {
    const feedbackId = req.params.id;
    if (req.user.role !== 'leder') return res.status(403).json({ error: 'Only leaders can delete feedback.' });

    db.run('DELETE FROM feedback WHERE id = ?', [feedbackId], function (err) {
        if (err) return res.status(500).json({ error: 'Error deleting feedback.' });
        res.json({ message: 'Feedback deleted successfully!' });
    });
});

// Route for registering.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'registering.html'));
});

// Route for login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'login.html'));
});

// Route for main.html
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'main.html'));
});

// Route for feedback.html
app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'feedback.html'));
});

// Route for leder.html
app.get('/leder', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'leder.html'));
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
