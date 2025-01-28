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

// Servér statiske filer fra "public" mappen
app.use(express.static(path.join(__dirname, 'public')));

// SQLite-forbindelse
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('Fejl ved forbindelse til SQLite:', err.message);
    } else {
        console.log('Tilsluttet SQLite-database');
        // Opret nødvendige tabeller, hvis de ikke findes
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT
            );
        `);
    }
});

// Middleware til autentificering af tokens fra HttpOnly-cookie
function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Læs token fra cookie
    if (!token) {
        return res.status(401).json({ error: 'Ingen adgang. Log ind først.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token er ugyldig eller udløbet.' });
        }
        req.user = user; // Gem brugerinfo til senere brug
        next();
    });
}

// Middleware til autorisation baseret på rolle
function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Ingen adgang til denne handling.' });
        }
        next();
    };
}

// **Login-route: Opret JWT og refresh token**
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Ugyldige loginoplysninger.' });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (!match) {
                return res.status(403).json({ error: 'Ugyldige loginoplysninger.' });
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

            // Sæt HttpOnly-cookies
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: true, // Kun HTTPS
                sameSite: 'strict',
                maxAge: 3600000 // 1 time
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dage
            });

            res.json({ message: 'Login succesfuldt!', role: user.role });
        });
    });
});

// **Refresh token-route: Forny adgangstoken**
app.post('/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Læs refresh token fra cookie
    if (!refreshToken) {
        return res.status(401).json({ error: 'Ingen refresh token. Log ind igen.' });
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
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000 // 1 time
        });

        res.json({ message: 'Access token fornyet!' });
    });
});

// **Logout-route: Slet HttpOnly-cookies**
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logget ud succesfuldt!' });
});

// **Beskyttede ruter (kræver token)**
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

// Start server
app.listen(PORT, () => {
    console.log(`Serveren kører på port ${PORT}`);
});
