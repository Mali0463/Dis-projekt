const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json()); // Parse JSON requests

app.use(express.static('public')) //server will use all the html css and javascript files from here

// In-memory user storage (for demonstration purposes)
const users = [];
const JWT_SECRET = 'your_jwt_secret'; // Secret key for JWT

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});