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