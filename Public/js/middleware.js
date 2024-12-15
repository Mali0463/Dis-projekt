// middleware.js
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log('Ingen token fundet. Omdirigerer til index.html');
        return res.redirect('/index.html'); // Omdirigerer til login, hvis der ikke er nogen token
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            console.log('Token verificering fejlede:', err.message);
            return res.redirect('/index.html'); // Omdirigerer til login, hvis token er ugyldig
        }

        // Token er verificeret, fortsæt til næste middleware eller route-handler
        console.log('Token verificeret. Brugeroplysninger:', user);
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;