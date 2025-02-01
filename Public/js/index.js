document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded and parsed');

    /* ---------------------- Cookie Consent ---------------------- */
    if (!localStorage.getItem('cookiesAccepted')) {
        const consent = confirm('Denne hjemmeside bruger cookies for at sikre, at du får den bedste oplevelse. Vil du acceptere brugen af cookies?');
        if (consent) {
            localStorage.setItem('cookiesAccepted', 'true');
        } else {
            alert('Du skal acceptere cookies for at bruge denne hjemmeside.');
            window.location.href = 'https://www.google.com';
            return;
        }
    }

    /* ---------------------- Sticky Header ---------------------- */
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('sticky', window.scrollY > 0);
    });

    /* ---------------------- Mobile Menu Toggle ---------------------- */
    const menu = document.getElementById('menu-icon');
    const navbar = document.querySelector('.navbar');
    if (menu && navbar) {
        menu.onclick = () => {
            menu.classList.toggle('bx-x');
            navbar.classList.toggle('open');
        };
    }

    /* ---------------------- ScrollReveal Animationer ---------------------- */
    const sr = ScrollReveal({
        distance: '30px',
        duration: 2500,
        reset: true
    });

    sr.reveal('.home-text', { delay: 200, origin: 'left' });
    sr.reveal('.home-img', { delay: 200, origin: 'right' });
    sr.reveal('.container, .about, .menu, .contact', { delay: 200, origin: 'bottom' });

    /* ---------------------- Login/Signup Knap ---------------------- */
    const loginButton = document.getElementById('login-user');
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login/Signup knappen blev trykket');
            window.location.href = '/login.html';
        });
    } else {
        console.error('Login/Signup knappen kunne ikke findes i DOM.');
    }
});
