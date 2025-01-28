require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 6005;
const JWT_SECRET = process.env.JWT_SECRET || 'EnLangHemmeligNoegle123XYZ!';
const TOKEN_EXPIRATION = '1h'; // Access token gyldighed
const REFRESH_EXPIRATION = '7d'; // Refresh token gyldighed

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// SQLite-forbindelse
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('Fejl ved forbindelse til SQLite:', err.message);
    } else {
        console.log('Tilsluttet SQLite-database');
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

// Middleware til autentificering
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Ingen token. Log ind først.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ugyldig eller udløbet token.' });
        }
        req.user = user; // Gem brugerinfo
        next();
    });
}

// Middleware til rollebaseret adgang
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Adgang nægtet.' });
        }
        next();
    };
}

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Ugyldige loginoplysninger.' });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (!match) {
                return res.status(403).json({ error: 'Forkert adgangskode.' });
            }

            const accessToken = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRATION }
            );

            const refreshToken = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: REFRESH_EXPIRATION }
            );

            // Kun HTTPS i produktion
            const isProduction = process.env.NODE_ENV === 'production';

            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: isProduction, // Kun sikre cookies i produktion
                sameSite: 'strict',
                maxAge: 3600000 // 1 time
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dage
            });

            res.json({ message: 'Login succesfuldt!', role: user.role });
        });
    });
});

// Refresh Token Route
app.post('/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Ingen refresh token.' });
    }

    jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ugyldig refresh token.' });
        }

        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRATION }
        );

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 time
        });

        res.json({ message: 'Token fornyet!' });
    });
});

// Logout Route
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logget ud succesfuldt!' });
});

// Protected Routes
app.get('/employees', authenticateToken, authorizeRole('leder'), (req, res) => {
    db.all('SELECT email FROM users WHERE role = "medarbejder"', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Fejl ved hentning af medarbejdere.' });
        }
        res.json(rows);
    });
});

app.get('/feedback', authenticateToken, (req, res) => {
    if (req.user.role === 'leder') {
        db.all(`
            SELECT feedback.id, feedback.content, users.email AS recipient_email
            FROM feedback
            JOIN users ON feedback.user_id = users.id
        `, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Fejl ved hentning af feedback.' });
            }
            res.json({ feedback: rows });
        });
    } else {
        db.all('SELECT id, content FROM feedback WHERE user_id = ?', [req.user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Fejl ved hentning af feedback.' });
            }
            res.json({ feedback: rows });
        });
    }
});

// Debugging Route
app.get('/decode-token', authenticateToken, (req, res) => {
    res.json(req.user);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Serveren kører på port ${PORT}`);
});
