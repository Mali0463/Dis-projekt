const express = require('express');
const crypto = require('crypto');
const sqlite = require('sqlite3').verbose();
//const jwt = require('jsonwebtoken');

// Initialiser Express
const app = express();
const port = 5000;

app.use(express.static('public')) //server will use all the html css and javascript files from here

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
//const JWT_SECRET = 'your_jwt_secret'; // Secret key for JWT

// API-endpoint: Tilføj en ny bruger
app.post('/users', (req, res) => {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const sql = `INSERT INTO Users (Email, Password) VALUES (?, ?)`;
    const params = [Email, Password];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    });
});

// Function to hash passwords
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// User Registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password and store the user
    const hashedPassword = hashPassword(password);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);

    // Validate user credentials
    if (user && user.password === hashPassword(password)) {
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token }); // Send the token back to the client
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});