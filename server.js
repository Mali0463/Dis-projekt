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
const port = 3000;

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

// Login Endpoint
// Login Endpoint
const secretKey = process.env.SECRET_KEY; // Brug miljøvariabel til at sikre nøglen

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

            // Log role for debugging
            console.log(`Bruger ${email} logget ind med rollen: ${row.role}`);

            // Send redirect URL baseret på brugerens rolle
            let redirectUrl = row.role === 'leder' ? '/leder.html' : '/main.html';
            res.status(200).json({ message: 'Login succesfuldt!', redirectUrl });
        } else {
            console.log('Adgangskoden matcher ikke');
            res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }
    } catch (err) {
        console.error('Fejl under login:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
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

// Start serveren
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});
