const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Adgang nægtet. Ingen token fundet.' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Ugyldig token.' });
        }
        req.user = decoded; // Gem decoded payload i anmodningen
        next();
    });
};
