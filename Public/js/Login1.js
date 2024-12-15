/*document.getElementById('login-user').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Alle felter skal udfyldes.');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            window.location.href = data.redirectUrl;
        } else {
            const error = await response.json();
            alert(`Fejl: ${error.error}`);
        }
    } catch (err) {
        console.error('Fejl under login:', err);
    }
});
*/