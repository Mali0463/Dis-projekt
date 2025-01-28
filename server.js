/***************************************
 * server.js
 ***************************************/
require('dotenv').config(); // Hvis du vil bruge .env-variabler

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 6005;
const JWT_SECRET = process.env.JWT_SECRET || 'EnLangHemmeligNoegle123XYZ!';
const DB_PATH = process.env.DATABASE_PATH || 'users.db';
const TOKEN_EXPIRATION = '1h';

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Servér statiske filer fra "public" (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// SQLite-forbindelse
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Fejl ved tilslutning til SQLite:', err.message);
    } else {
        console.log(`Tilsluttet SQLite-database på: ${DB_PATH}`);
        // Opret tabeller, hvis de ikke allerede findes
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

// Middleware til at læse token fra HttpOnly-cookie i stedet for Authorization-header
function authenticateToken(req, res, next) {
    // Læs token fra cookie
    const token = req.cookies.token; 
    if (!token) {
        // Ingen cookie => ikke logget ind
        return res.status(401).json({ error: 'No token, please log in.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user; // fx { id, role }
        next();
    });
}

// Opret bruger (REGISTER)
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Error hashing password.' });
        }
        db.run(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role],
            function (err) {
                if (err) {
                    console.error('Fejl ved oprettelse af bruger:', err);
                    return res.status(400).json({ error: 'Email already exists or DB error.' });
                }
                res.status(201).json({ message: 'User registered successfully!' });
            }
        );
    });
});

// Login (POST /login) => sæt HttpOnly-cookie med JWT
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('DB-fejl ved login:', err);
            return res.status(500).json({ error: 'Server error.' });
        }
        if (!user) {
            return res.status(400).json({ error: 'User not found.' });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                return res.status(403).json({ error: 'Invalid credentials.' });
            }

            // Opret JWT
            const token = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRATION }
            );

            // Sæt cookie med token
            res.cookie('token', token, {
                httpOnly: true,      // Kan IKKE tilgås fra JS i browseren => sikrere mod XSS
                secure: true,        // Kræver HTTPS
                sameSite: 'strict',  // Beskytter mod CSRF
                maxAge: 3600000      // 1 time i millisekunder
            });

            // Returnér rollen, så clienten kan vide, hvor man skal navigere hen
            return res.json({
                message: 'Login successful!',
                role: user.role
            });
        });
    });
});


// Logout => slet cookie
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully!' });
});

// GET /employees (kræver leder)
app.get('/employees', authenticateToken, (req, res) => {
    if (req.user.role !== 'leder') {
        return res.status(403).json({ error: 'Only leaders can view employees.' });
    }
    db.all('SELECT email FROM users WHERE role = "medarbejder"', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching employees.' });
        }
        res.json(rows);
    });
});

// POST /feedback (kræver lederrolle)
app.post('/feedback', authenticateToken, (req, res) => {
    if (req.user.role !== 'leder') {
        return res.status(403).json({ error: 'Only leaders can give feedback.' });
    }

    const { recipient_email, content } = req.body;
    if (!recipient_email || !content) {
        return res.status(400).json({ error: 'recipient_email and content required.' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [recipient_email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error finding user by email.' });
        }
        if (!row) {
            return res.status(400).json({ error: 'No user found with that email.' });
        }

        db.run(
            'INSERT INTO feedback (user_id, content) VALUES (?, ?)',
            [row.id, content],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Error saving feedback.' });
                }
                res.json({ message: 'Feedback saved successfully!' });
            }
        );
    });
});

// GET /feedback - leder => alt, medarbejder => eget
app.get('/feedback', authenticateToken, (req, res) => {
    if (req.user.role === 'leder') {
        db.all(`
            SELECT feedback.id, feedback.content, users.email as recipient_email
            FROM feedback
            JOIN users ON feedback.user_id = users.id
        `, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'DB error fetching feedback.' });
            }
            res.json({ feedback: rows });
        });
    } else {
        db.all('SELECT id, content FROM feedback WHERE user_id = ?', [req.user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'DB error fetching feedback.' });
            }
            res.json({ feedback: rows });
        });
    }
});

// PUT /feedback/:id (kræver leder)
app.put('/feedback/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'leder') {
        return res.status(403).json({ error: 'Only leaders can edit feedback.' });
    }
    const feedbackId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required to update feedback.' });
    }

    db.run('UPDATE feedback SET content = ? WHERE id = ?', [content, feedbackId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error updating feedback.' });
        }
        res.json({ message: 'Feedback updated successfully!' });
    });
});

// DELETE /feedback/:id (kræver leder)
app.delete('/feedback/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'leder') {
        return res.status(403).json({ error: 'Only leaders can delete feedback.' });
    }
    const feedbackId = req.params.id;

    db.run('DELETE FROM feedback WHERE id = ?', [feedbackId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting feedback.' });
        }
        res.json({ message: 'Feedback deleted successfully!' });
    });
});

// HTML-ruter
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});
app.get('/leder', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leder.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registering.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



