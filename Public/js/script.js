document.addEventListener('DOMContentLoaded', () => {
    // Kontrollerer om brugeren har en gyldig JWT-token
    fetch('/protected', {
        method: 'GET',
        credentials: 'include' // Inkluderer JWT-cookien i anmodningen
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url; // Hvis brugeren bliver omdirigeret, sendes de til den nye URL
        } else if (!response.ok) {
            window.location.href = '/index.html'; // Omdiriger til login-siden, hvis anmodningen fejler
        }
    })
    .catch(error => console.error('Fejl:', error));

    // Funktionsdefinition for at vise feedback-kategorier
    function showFeedback(categoryId) {
        // Hide all feedback categories
        const categories = document.querySelectorAll('.feedback-category');
        categories.forEach(category => {
            category.classList.add('hidden');
        });

        // Show the selected feedback category
        const selectedCategory = document.getElementById(categoryId);
        if (selectedCategory) {
            selectedCategory.classList.remove('hidden');
        }
    }

    // Gør funktionen tilgængelig globalt, så den kan bruges i HTML'en
    window.showFeedback = showFeedback;
});
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });
        if (response.ok) {
            window.location.href = '/index.html';
        } else {
            console.error('Fejl under logout:', response.statusText);
        }
    } catch (error) {
        console.error('Fejl under logout:', error);
    }
});