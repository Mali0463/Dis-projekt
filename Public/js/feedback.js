document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Forhindrer sideopdatering

    const recipientEmail = document.getElementById('recipientEmail').value;
    const feedback = document.getElementById('feedback').value;

    // Simple validering
    if (!recipientEmail || !feedback) {
        alert('Alle felter skal udfyldes!');
        return;
    }

    try {
        // Hent token fra cookies (hvis den gemmes der)
        const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];

        // Send POST-request til serveren
        const response = await fetch('/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Token i headeren
            },
            body: JSON.stringify({ recipient_email: recipientEmail, feedback })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('feedbackResponse').innerText = data.message;
            document.getElementById('feedbackForm').reset(); // Nulstil formularen
        } else {
            document.getElementById('feedbackResponse').innerText = data.error || 'Der opstod en fejl';
        }
    } catch (err) {
        console.error('Fejl ved feedback:', err);
        document.getElementById('feedbackResponse').innerText = 'Der opstod en fejl ved afsendelse af feedback';
    }
});
