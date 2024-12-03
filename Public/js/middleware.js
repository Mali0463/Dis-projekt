const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'dinSuperHemmeligNøgle';

function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Få token fra cookie

    if (!token) {
        return res.redirect('/index.html'); // Gå tilbage til forsiden, hvis ingen token findes
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.redirect('/index.html'); // Gå tilbage til forsiden, hvis token ikke er gyldig
        }
        req.user = user; // Gem brugerinfo til brug senere
        next(); // Fortsæt til den næste middleware
    });
}

module.exports = authenticateToken;