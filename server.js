const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

// JWT Secret Key
const JWT_SECRET = 'secret123';

// Database setup
const db = new sqlite3.Database('./database/users.db', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to SQLite database.');
});

// Create tables if not exist
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
        feedback TEXT,
        recipient_email TEXT,
        sender_email TEXT
    );
`);

// Register route
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email og password er påkrævet' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
            [email, hashedPassword, role || 'Medarbejder'],
            (err) => {
                if (err) return res.status(400).json({ error: 'Email eksisterer allerede' });
                res.status(201).json({ message: 'Bruger oprettet!' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Serverfejl ved registrering' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Brugeren findes ikke' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ error: 'Forkert password' });

        const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role });
    });
});

// Middleware for verifying JWT
const verifyJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Ingen token' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Ugyldig token' });
        req.user = decoded;
        next();
    });
};

// Feedback route (leder giver feedback)
app.post('/feedback', verifyJWT, (req, res) => {
    const { feedback, recipient_email } = req.body;
    const sender_email = req.user.email;

    if (!feedback || !recipient_email) return res.status(400).json({ error: 'Feedback og modtager er påkrævet' });

    db.run(
        `INSERT INTO feedback (feedback, recipient_email, sender_email) VALUES (?, ?, ?)`,
        [feedback, recipient_email, sender_email],
        (err) => {
            if (err) return res.status(500).json({ error: 'Serverfejl ved at indsætte feedback' });
            res.json({ message: 'Feedback sendt!' });
        }
    );
});

// Get feedback for medarbejder
app.get('/feedback', verifyJWT, (req, res) => {
    const userEmail = req.user.email;

    db.all(`SELECT feedback, sender_email FROM feedback WHERE recipient_email = ?`, [userEmail], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Serverfejl ved at hente feedback' });
        res.json(rows);
    });
});

// Rediger feedback (leder kan opdatere feedback)
app.put('/feedback/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const sender_email = req.user.email;

    if (!feedback) return res.status(400).json({ error: 'Feedback-teksten er påkrævet' });

    db.run(
        `UPDATE feedback SET feedback = ? WHERE id = ? AND sender_email = ?`,
        [feedback, id, sender_email],
        function (err) {
            if (err) return res.status(500).json({ error: 'Fejl ved opdatering af feedback' });
            if (this.changes === 0) return res.status(404).json({ error: 'Feedback ikke fundet eller mangler tilladelse' });
            res.json({ message: 'Feedback opdateret!' });
        }
    );
});

// Slet feedback (leder kan slette feedback)
app.delete('/feedback/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const sender_email = req.user.email;

    db.run(
        `DELETE FROM feedback WHERE id = ? AND sender_email = ?`,
        [id, sender_email],
        function (err) {
            if (err) return res.status(500).json({ error: 'Fejl ved sletning af feedback' });
            if (this.changes === 0) return res.status(404).json({ error: 'Feedback ikke fundet eller mangler tilladelse' });
            res.json({ message: 'Feedback slettet!' });
        }
    );
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
