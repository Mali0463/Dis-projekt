document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const role = document.getElementById('register-role').value;

    if (!email || !password) {
        alert('Udfyld venligst både email og password');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Bruger oprettet succesfuldt!');
            window.location.href = '/login.html';
        } else {
            alert(`Fejl: ${result.error}`);
        }
    } catch (err) {
        console.error('Fejl under registrering:', err);
        alert('Serverfejl. Prøv igen senere.');
    }
});
