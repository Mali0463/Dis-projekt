const express = require('express');

// Initialiser Express
const app = express();
const port = 3000;

// Brug JSON-parser til at håndtere POST-forespørgsler
app.use(express.json());

// Start serveren 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});