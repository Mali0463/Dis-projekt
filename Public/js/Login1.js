/*document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Udfyld venligst email og password.');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Login succesfuld!');
            localStorage.setItem('token', data.token); // Gem JWT-token
            localStorage.setItem('role', data.role); // Gem rolle for bruger

            // Omdirigering baseret på rolle
            if (data.role === 'leder') {
                window.location.href = '/leder.html';
            } else if (data.role === 'medarbejder') {
                window.location.href = '/main.html';
            }
        } else {
            alert(`Fejl: ${data.error || 'Serverfejl'}`);
        }
    } catch (err) {
        console.error('Fejl under login:', err);
        alert('Der opstod en serverfejl. Prøv igen senere.');
    }
});
*/