const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.json()); // Middleware for at parse JSON

// Dummy-database til brugere
const users = [];

// Generer en salt
function generateSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

// Hash password med salt og runder
function hashWithSaltRounds(password, salt, rounds) {
    let hash = password + salt;
    for (let i = 0; i < rounds; i++) {
        hash = crypto.createHash('sha256').update(hash).digest('hex');
    }
    return hash;
}

// Registreringsrute
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Tjek om brugernavn allerede findes
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    // Generer en salt
    const salt = generateSalt();

    // Hash passwordet med salt og angiv antal runder
    const rounds = 10; // Øg for mere sikkerhed, men vær opmærksom på performance
    const hashedPassword = hashWithSaltRounds(password, salt, rounds);

    // Gem brugeren med salt og hashed password
    users.push({ username, salt, hashedPassword });

    res.status(201).json({ message: 'User created successfully' });
});

// Start serveren
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
