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

// Ruter til specifikke HTML-sider (hvis nødvendigt)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


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
    iv TEXT NOT NULL
)`);

// Login Endpoint
const secretKey = process.env.SECRET_KEY; // Brug miljøvariabel til at sikre nøglen

// Promisify database metoder
const dbGet = util.promisify(db.get).bind(db);

app.use(cookieParser()); // Brug cookie-parser middleware

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });
    }

    try {
        const row = await dbGet(`SELECT * FROM users WHERE email = ?`, [email]);

        if (!row) {
            return res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }

        const match = await bcrypt.compare(password, row.password);
        if (match) {
            // Opret en JWT med brugeroplysninger
            const token = jwt.sign({ id: row.id, email: row.email }, secretKey, {
                expiresIn: '1h' // Tokenen udløber efter 1 time
            });

            // Send token som en HTTP-Only cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Kun over HTTPS
                sameSite: 'strict',
                maxAge: 3600000
            });            

            console.log(`Bruger ${email} logget ind.`);
            res.status(200).json({ message: 'Login succesfuldt!' });
        } else {
            res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }
    } catch (err) {
        console.error('Fejl under login:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});

const authenticateToken = require('./public/js/middleware');

app.get('/protected', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html')); // Send brugeren til main.html, hvis autentificeret
});


// Endpoint til registrering
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });
    }

    try {
        // Krypter adgangskoden
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generér en IV til brug for kryptering
        const iv = crypto.randomBytes(16).toString('hex');

        // Indsæt brugeren i databasen med IV
        const sql = `INSERT INTO users (email, password, iv) VALUES (?, ?, ?)`;
        db.run(sql, [email, hashedPassword, iv], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email eksisterer allerede' });
                }
                return res.status(500).json({ error: 'Databasefejl: ' + err.message });
            }
            console.log(`Bruger tilføjet med email: ${email}`);
            res.status(201).json({ message: 'Bruger registreret med succes!' });
        });
    } catch (err) {
        console.error('Fejl ved registrering:', err);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});


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
