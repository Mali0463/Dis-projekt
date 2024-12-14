const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'Public')));

// Database setup
let db = new sqlite3.Database('/var/www/app/users.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create tables if they don't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    iv TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'medarbejder'
)`);

db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    feedback TEXT NOT NULL,
    FOREIGN KEY (recipient_email) REFERENCES users (email)
)`);

// Promisify SQLite methods
const util = require('util');
const dbGet = util.promisify(db.get).bind(db);
const dbAll = util.promisify(db.all).bind(db);
const dbRun = util.promisify(db.run).bind(db);

// Secret key for JWT
const secretKey = process.env.SECRET_KEY;

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html')); // Sørg for, at index.html findes i Public-mappen
});

app.get('/main.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'main.html'));
});


app.get('/registering.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'registering.html')); // Sørg for, at filen findes i Public-mappen
});

app.get('/leder.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'leder.html'));
});

app.get('/feedback.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'main.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'login.html')); // Sørg for, at filen findes i Public-mappen
});


// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });
    }

    try {
        // Hent brugeren fra databasen
        const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) {
            return res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }

        // Verificer adgangskoden
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }

        // Opret en JWT
        const token = jwt.sign({ email: user.email, role: user.role }, process.env.SECRET_KEY, {
            expiresIn: '1h',
        });

        // Send token som cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Sørg for HTTPS i produktionsmiljø
            sameSite: 'strict',
            maxAge: 3600000,
        });

        res.status(200).json({
            message: 'Login succesfuldt!',
            redirectUrl: user.role === 'leder' ? '/leder.html' : '/main.html',
        });
    } catch (err) {
        console.error('Fejl:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});


// Register
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Alle felter skal udfyldes' });
    }

    try {
        // Hash adgangskoden
        const hashedPassword = await bcrypt.hash(password, 10);
        const iv = crypto.randomBytes(16).toString('hex');

        // Indsæt bruger i databasen
        await dbRun(
            `INSERT INTO users (email, password, iv, role) VALUES (?, ?, ?, ?)`,
            [email, hashedPassword, iv, role]
        );

        // Opret en JWT
        const token = jwt.sign({ email, role }, process.env.SECRET_KEY, {
            expiresIn: '1h',
        });

        // Returner token som en cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Sørg for HTTPS i produktionsmiljø
            sameSite: 'strict',
            maxAge: 3600000,
        });

        res.status(201).json({ message: 'Bruger registreret med succes!' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Email eksisterer allerede' });
        } else {
            console.error('Databasefejl:', err.message);
            res.status(500).json({ error: 'Intern serverfejl' });
        }
    }
});



// Logout
app.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
    res.redirect('/');
});

// Feedback
app.post('/feedback', authenticateToken, async (req, res) => {
    const { recipient_email, feedback } = req.body;
    if (!recipient_email || !feedback) {
        return res.status(400).json({ error: 'Recipient email and feedback are required' });
    }

    try {
        await dbRun(`INSERT INTO feedback (recipient_email, feedback) VALUES (?, ?)`, [recipient_email, feedback]);
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/feedback/user', authenticateToken, async (req, res) => {
    try {
        const feedbacks = await dbAll(`SELECT feedback FROM feedback WHERE recipient_email = ?`, [req.user.email]);
        if (feedbacks.length === 0) {
            return res.status(404).json({ error: 'No feedback found for this user' });
        }
        res.status(200).json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Node.js Server (Local Only)
app.listen(port, () => {
    console.log(`Node.js Server running on port ${port}`);
});
