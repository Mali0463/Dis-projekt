document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Find HTML-elementerne
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');

    // Tjek om elementerne findes
    if (!emailInput || !passwordInput || !roleInput) {
        console.error("Et af inputfelterne blev ikke fundet i DOM'en.");
        return;
    }

    // Indsaml data
    const email = emailInput.value;
    const password = passwordInput.value;
    const role = roleInput.value;

    if (!email || !password) {
        alert('Venligst udfyld alle felter');
        return;
    }

    try {
        // Send data til serveren
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });

        if (response.ok) {
            alert('Bruger registreret succesfuldt!');
            window.location.href = '/login.html';
        } else {
            const errorData = await response.json();
            alert(`Fejl: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Der opstod en fejl under registreringen:', error);
        alert('Der opstod en fejl. Prøv igen senere.');
    }
});
