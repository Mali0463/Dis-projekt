document.getElementById('register-user').addEventListener('click', async (e) => {
    e.preventDefault();

    // Indsaml input data
    const email = document.getElementById('Register-email').value;
    const password = document.getElementById('Register-password').value;

    if (!email || !password) {
        alert('Venligst udfyld begge felter');
        return;
    }

    try {
        // Send data til serveren via POST-forespørgsel
        const response = await fetch('http://138.197.191.195:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });
        

        if (response.ok) {
            alert('Bruger registreret med succes!');
            window.location.href = '/login.html'; // Omdirigerer til login-siden
        } else {
            const errorData = await response.json();
            alert(`Fejl: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Fejl under registrering:', error);
        alert('Der opstod en fejl. Prøv igen.');
    }
})
