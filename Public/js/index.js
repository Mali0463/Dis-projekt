document.addEventListener('DOMContentLoaded', () => {
    /* ---------------------- Cookie Consent ---------------------- */
    if (!localStorage.getItem('cookiesAccepted')) {
      const consent = confirm(
        'Denne hjemmeside bruger cookies for at sikre, at du får den bedste oplevelse. Vil du acceptere brugen af cookies?'
      );
      if (consent) {
        localStorage.setItem('cookiesAccepted', 'true');
      } else {
        alert('Du skal acceptere cookies for at bruge denne hjemmeside.');
        window.location.href = 'https://www.google.com';
        return; // Stop yderligere kørsel, hvis der ikke gives samtykke
      }
    }
  
    /* ---------------------- Smooth Scrolling for Nav Links ---------------------- */
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        const targetSection = document.querySelector(link.getAttribute('href'));
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  
    /* ---------------------- Sticky Header ---------------------- */
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
      header.classList.toggle('sticky', window.scrollY > 0);
      // Luk mobilmenuen når der scrolles
      document.querySelector('#menu-icon').classList.remove('bx-x');
      document.querySelector('.navbar').classList.remove('open');
    });
  
    /* ---------------------- Mobile Menu Toggle ---------------------- */
    const menu = document.querySelector('#menu-icon');
    const navbar = document.querySelector('.navbar');
    menu.onclick = () => {
      menu.classList.toggle('bx-x');
      navbar.classList.toggle('open');
    };
  
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
        // Omdiriger til login-siden
        window.location.href = '/login.html';
      });
    } else {
      console.error('Login/Signup knappen kunne ikke findes i DOM.');
    }
  });
  