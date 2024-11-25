// Hent formular-elementet
const signupForm = document.getElementById('signup-form');

// Håndtér formularens indsendelse
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Forhindrer siden i at genindlæses

    // Hent inputværdier
    const email = document.getElementById('Register-email').value;
    const password = document.getElementById('Register-password').value;
    const confirmPassword = document.getElementById('Confirm-password').value;

    // Valider at passwords matcher
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Send data til serveren
    try {
        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Email: email,
                Password: password,
            }),
        });

        if (response.ok) {
            alert('User registered successfully!');
            // Eventuelt videresend brugeren til login-siden:
            window.location.href = 'Login.html';
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (err) {
        alert('Failed to connect to the server.');
        console.error(err);
    }
});
