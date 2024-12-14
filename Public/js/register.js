// Hent referencer til inputfelterne og knappen
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Indsaml input data
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const role = document.getElementById('register-role').value;

    // Valider input
    if (!email || !password) {
        alert('Venligst udfyld både e-mail og adgangskode.');
        return;
    }

    // Simpel e-mail validering
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Venligst indtast en gyldig e-mailadresse.');
        return;
    }

    try {
        // Send data til serveren via en POST-forespørgsel
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });

        if (response.ok) {
            // Hvis registreringen lykkes, informer brugeren og omdiriger
            alert('Registrering lykkedes! Du kan nu logge ind.');
            window.location.href = '/login.html';
        } else {
            // Håndter fejl fra serveren
            const errorData = await response.json();
            alert(`Fejl: ${errorData.error}`);
        }
    } catch (err) {
        console.error('Fejl under registrering:', err);
        alert('Noget gik galt. Prøv igen senere.');
    }
});
