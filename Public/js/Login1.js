document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);
        alert('Login succesfuldt!');
        window.location.href = data.role === 'Leder' ? '/leder.html' : '/main.html';
    } else {
        alert(data.error);
    }
});
