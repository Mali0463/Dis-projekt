document.getElementById('login-user').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Login-knappen blev trykket"); // Debug punkt: Log for at se, om knappen trykkes

    // Indsaml input data fra HTML-formularen
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Venligst udfyld begge felter');
        return;
    }

    try {
        // Send data til serveren via POST-forespørgsel
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            alert('Login succesfuldt!');
            window.location.href = data.redirectUrl; // Brug den rigtige redirect URL baseret på rollen
        } else {
            const errorData = await response.json();
            console.error("Fejl fra server:", errorData);
            alert(`Fejl: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Fejl under login:', error);
        alert('Der opstod en fejl. Prøv igen.');
    }
});
