const express = require('express');
const sqlite = require('sqlite3').verbose();

// Initialiser Express
const app = express();
const port = 3000;

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

// Start serveren 
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});