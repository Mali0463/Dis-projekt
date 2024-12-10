app.get('/feedback/user', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email er påkrævet for at hente feedback.' });
    }

    try {
        const feedbacks = await dbAll(`SELECT feedback FROM feedback WHERE recipient_email = ?`, [email]);
        res.status(200).json(feedbacks);
    } catch (err) {
        console.error('Fejl ved hentning af feedback:', err.message);
        res.status(500).json({ error: 'Intern serverfejl' });
    }
});
