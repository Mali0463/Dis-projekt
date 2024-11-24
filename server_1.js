const express = require('express');
const sqlite = require('sqlite3').verbose();

// Initialiser Express
const app = express();
const port = 4000;

// Brug JSON-parser til at håndtere POST-forespørgsler
app.use(express.json());

// Forbind til SQLite-database
const db = new sqlite.Database('./Database/database.sql', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// API-endpoint: Tilføj en ny bruger
app.post('/users', (req, res) => {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ error: 'All fields are required (Email, Password).' });
    }

    const sql = `INSERT INTO Users (Email, Password) VALUES (?, ?, ?)`;
    const params = [Email, Password];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User added successfully', userId: this.lastID });
    });
});

// Start serveren 
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});