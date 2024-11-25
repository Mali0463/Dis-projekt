const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serverer statiske filer fra 'public' mappen
app.use(express.static(path.join(__dirname, 'public')));

// Ruter til specifikke HTML-sider (hvis nødvendigt)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start serveren
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}`);
});
