document.getElementById('register-user').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.getElementById('Register-email').value;
    const password = document.getElementById('Register-password').value;
    const role = document.getElementById('Register-role').value;

    if (!email || !password || !role) {
        alert('Alle felter skal udfyldes.');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        if (response.ok) {
            alert('Registrering fuldført!');
            window.location.href = '/login.html';
        } else {
            const error = await response.json();
            alert(`Fejl: ${error.error}`);
        }
    } catch (err) {
        console.error('Fejl under registrering:', err);
    }
});
