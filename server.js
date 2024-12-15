const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const util = require('util');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const authenticateToken = require('./public/js/middleware');
const port = 5000;

app.use(express.json());
app.use(cookieParser());

// Serverer statiske filer fra 'public' mappen
app.use(express.static(path.join(__dirname, 'public')));

// Forbind til SQLite database
let db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Fejl ved forbindelse til database:', err.message);
    } else {
        console.log('Forbundet til SQLite-databasen users.db');
    }
});

// Opret tabel, hvis den ikke findes allerede
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

// Promisify database metoder
const dbGet = util.promisify(db.get).bind(db);
const dbAll = util.promisify(db.all).bind(db);
const dbRun = util.promisify(db.run).bind(db);

//Register endpoint
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const iv = crypto.randomBytes(16).toString('hex');

        // Indsæt bruger i databasen
        await dbRun(`INSERT INTO users (email, password, iv, role) VALUES (?, ?, ?, ?)`, [email, hashedPassword, iv, role || 'medarbejder']);

        // Generér token til ny bruger
        const token = jwt.sign({ email, role: role || 'medarbejder' }, secretKey, { expiresIn: '1h' });

        // Send token som cookie og redirect baseret på rolle
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000,
        });

        // Redirect til den korrekte side
        const redirectUrl = role === 'leder' ? '/leder.html' : '/main.html';
        res.status(201).json({ message: 'Registration successful', redirectUrl });

    } catch (err) {
        console.error(err);
        if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Login Endpoint
const secretKey = process.env.SECRET_KEY; // Brug miljøvariabel til at sikre nøglen

// Login Endpoint i server.js
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Hent bruger fra databasen
        const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Sammenlign password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generér ny token
        const token = jwt.sign({ email: user.email, role: user.role }, secretKey, { expiresIn: '1h' });

        // Send token som cookie og redirect
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000,
        });

        const redirectUrl = user.role === 'leder' ? '/leder.html' : '/main.html';
        res.status(200).json({ message: 'Login successful', redirectUrl });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//Beskyttet rute til main.html
app.get('/main.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Logout Endpoint
app.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.redirect('/index.html');
});

// Feedback endpoint
app.post('/feedback', async (req, res) => {
    const { recipient_email, feedback } = req.body;

    if (!recipient_email || !feedback) {
        return res.status(400).json({ error: 'Modtager email og feedback er påkrævet' });
    }

    try {
        await dbRun(`INSERT INTO feedback (recipient_email, feedback) VALUES (?, ?)`, [recipient_email, feedback]);
        console.log(`Feedback givet til ${recipient_email}`);
        res.status(201).json({ message: 'Feedback givet med succes!' });
    } catch (err) {
        console.error('Fejl ved indsættelse af feedback:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});

// Beskyttet rute til main.html uden token
app.get('/main.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Feedback uden token-validering
app.get('/feedback/user', async (req, res) => {
    const userEmail = req.query.email; // E-mail sendes som query parameter

    if (!userEmail) {
        return res.status(400).json({ error: 'Ingen e-mail blev angivet' });
    }

    try {
        const feedbacks = await dbAll(`SELECT feedback FROM feedback WHERE recipient_email = ?`, [userEmail]);
        if (feedbacks.length === 0) {
            return res.status(404).json({ error: 'Ingen feedback fundet for denne bruger' });
        }
        res.status(200).json(feedbacks);
    } catch (err) {
        console.error('Fejl under hentning af feedback:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});




app.get('/employees', async (req, res) => {
    try {
        const employees = await dbAll(`SELECT email FROM users WHERE role = 'medarbejder'`);
        res.status(200).json(employees);
    } catch (err) {
        console.error('Fejl under hentning af medarbejdere:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});


// Start serveren
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});