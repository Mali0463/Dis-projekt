const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Adgang nægtet: Token mangler' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ugyldig token' });
        }
        req.user = user; // Tilføjer brugeroplysninger til req-objektet
        next();
    });
};

module.exports = authenticateToken;
