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
