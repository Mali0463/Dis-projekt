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
const authenticateToken = require('./middleware');
const port = 3000;

app.use(express.json());
app.use(cookieParser());

// Serverer statiske filer fra 'public' mappen
app.use(express.static(path.join(__dirname, 'Public')));

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

// Login Endpoint
const secretKey = process.env.SECRET_KEY; // Brug miljøvariabel til at sikre nøglen

// Login Endpoint i server.js
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });
    }

    try {
        const row = await dbGet(`SELECT * FROM users WHERE email = ?`, [email]);

        if (!row) {
            console.log('Bruger ikke fundet i databasen');
            return res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }

        const match = await bcrypt.compare(password, row.password);
        if (match) {
            // Opret en JWT med brugeroplysninger inklusiv rolle
            const token = jwt.sign({ id: row.id, email: row.email, role: row.role }, secretKey, {
                expiresIn: '1h' // Tokenen udløber efter 1 time
            });

            // Send token som en HTTP-Only cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Kun over HTTPS
                sameSite: 'strict',
                maxAge: 3600000
            });

            console.log(`Bruger ${email} logget ind med rollen: ${row.role}`);
            res.status(200).json({ message: 'Login succesfuldt!', redirectUrl: row.role === 'leder' ? '/leder.html' : '/main.html' });
        } else {
            console.log('Adgangskoden matcher ikke');
            res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }
    } catch (err) {
        console.error('Fejl under login:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});


app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });
    }

    try {
        // Krypter adgangskoden
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generér en IV til brug for kryptering
        const iv = crypto.randomBytes(16).toString('hex');

        // Indsæt brugeren i databasen med IV og rolle
        const sql = `INSERT INTO users (email, password, iv, role) VALUES (?, ?, ?, ?)`;
        db.run(sql, [email, hashedPassword, iv, role || 'medarbejder'], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email eksisterer allerede' });
                }
                return res.status(500).json({ error: 'Databasefejl: ' + err.message });
            }
            console.log(`Bruger tilføjet med email: ${email} og rolle: ${role || 'medarbejder'}`);
            res.status(201).json({ message: 'Bruger registreret med succes!' });
        });
    } catch (err) {
        console.error('Fejl ved registrering:', err);
        res.status(500).json({ error: 'Intern serverfejl' });
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
