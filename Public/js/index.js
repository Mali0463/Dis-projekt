// Add event listener to each nav link for smooth scrolling
const navLinks = document.querySelectorAll('.nav-links a');

// Function to handle link click with smooth scroll to target section
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();  // Prevent default link behavior

        // Get the target section
        const targetSection = document.querySelector(link.getAttribute('href'));
        if (targetSection) {
            // Smoothly scroll to the section
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Sticky Header on Scroll
const header = document.querySelector("header");

window.addEventListener("scroll", function() {
    header.classList.toggle("sticky", window.scrollY > 0);
});

// Mobile Menu Toggle
let menu = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navbar.classList.toggle('open');
}

window.onscroll = () => {
    menu.classList.remove('bx-x');
    navbar.classList.remove('open');
}

// ScrollReveal Animations
const sr = ScrollReveal({
    distance: '30px',
    duration: 2500,
    reset: true
});

sr.reveal('.home-text', { delay: 200, origin: 'left' });
sr.reveal('.home-img', { delay: 200, origin: 'right' });
sr.reveal('.container, .about, .menu, .contact', { delay: 200, origin: 'bottom' });
document.addEventListener('DOMContentLoaded', () => {
    // Check if cookies are already accepted
    if (!localStorage.getItem('cookiesAccepted')) {
        // Display alert for cookie consent
        let consent = confirm('Denne hjemmeside bruger cookies for at sikre, at du får den bedste oplevelse. Vil du acceptere brugen af cookies?');
        if (consent) {
            localStorage.setItem('cookiesAccepted', 'true');
        } else {
            alert('Du skal acceptere cookies for at bruge denne hjemmeside.');
            window.location.href = 'https://www.google.com'; // Redirect user if they do not accept cookies
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookiesAccepted')) {
        document.getElementById('cookie-consent').style.display = 'block';
    }

    document.getElementById('accept-cookies').addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        document.getElementById('cookie-consent').style.display = 'none';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Find login-knappen
    const loginButton = document.getElementById('login-user');
    
    // Tjek om knappen er fundet
    if (loginButton) {
        loginButton.addEventListener('click', async (e) => {
            e.preventDefault();

            console.log("Login-knappen blev trykket"); // Debug punkt: Log for at se, om knappen trykkes

            // Indsaml input data fra HTML-formularen
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            console.log("Indsamlede data:", { email, password }); // Debug punkt: Log indsamlet data

            // Tjek om felterne er tomme
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

                console.log("Response status:", response.status); // Debug punkt: Log response status

                // Håndterer serverens svar
                if (response.ok) {
                    const data = await response.json();
                    alert('Login succesfuldt!');
                    window.location.href = data.redirectUrl; // Omdiriger til den rigtige side baseret på rollen
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
    } else {
        console.error('Login-knappen kunne ikke findes i DOM\'en. Sørg for, at knappen med ID "login-user" findes.');
    }
});
