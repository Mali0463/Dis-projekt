document.getElementById('login-user').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Login-knappen blev trykket"); // Debug punkt 1: Log for at se, om knappen trykkes

    // Indsaml input data fra HTML-formularen
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log("Indsamlede data:", { email, password }); // Debug punkt 2: Log indsamlet data

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

        console.log("Response status:", response.status); // Debug punkt 3: Log response status

        if (response.ok) {
            alert('Login succesfuldt!');
            window.location.href = '/main.html'; // Omdirigerer til main-siden ved succesfuldt login
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
