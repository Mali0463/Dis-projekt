document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Forhindrer standard formularindsendelse

    // Hent værdier fra inputfelterne
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    if (!email || !password) {
        alert('Venligst udfyld alle felter');
        return;
    }

    try {
        // Send POST-forespørgsel til serveren
        const response = await fetch('http://joenthejuice.com/register', { // Opdateret URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Bruger oprettet! Du kan nu logge ind.');
            window.location.href = '/login.html';
        } else {
            console.error('Fejl:', data);
            alert(`Fejl: ${data.error}`);
        }
    } catch (error) {
        console.error('Netværksfejl:', error);
        alert('Der opstod en fejl. Prøv igen senere.');
    }
});
