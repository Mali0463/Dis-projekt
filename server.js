const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(express.json());

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
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Login mangler email eller adgangskode');
        return res.status(400).json({ error: 'Email og adgangskode er påkrævet' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
        if (err) {
            console.error('Databasefejl:', err.message);
            return res.status(500).json({ error: 'Databasefejl' });
        }

        console.log('Databaseopslag result:', row); // Debug punkt

        if (!row) {
            console.log('Bruger ikke fundet med email:', email);
            return res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
        }

        try {
            const match = await bcrypt.compare(password, row.password);
            console.log('Password sammenligning:', match); // Debug punkt

            if (match) {
                console.log(`Bruger ${email} logget ind.`);
                res.status(200).json({ message: 'Login succesfuldt!' });
            } else {
                console.log('Adgangskode matcher ikke for bruger:', email);
                res.status(400).json({ error: 'Ugyldig email eller adgangskode' });
            }
        } catch (error) {
            console.error('Fejl ved adgangskode sammenligning:', error);
            res.status(500).json({ error: 'Intern serverfejl' });
        }
    });
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


// Start serveren
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});
